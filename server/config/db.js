const mongoose = require('mongoose');
const dns = require('dns');

// On Node 17+, force IPv4-first resolution to prevent SRV lookup timeouts on Linux containers (Render/Docker)
if (dns && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Retrieves the MongoDB URI from supported environment variables,
 * trimming any whitespace or accidental wrapping quotes.
 */
const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) return null;
  return uri.trim().replace(/^["']|["']$/g, '');
};

/**
 * Safely masks database credentials from connection strings and error logs.
 */
const maskMongoUri = (raw) => {
  if (!raw) return '<empty>';
  return String(raw).replace(/\/\/[^:]+:[^@]+@/g, '//***:***@');
};

/**
 * Logs categorized diagnostic guidance for common MongoDB Atlas issues
 * without exposing sensitive credentials in deployment logs.
 */
const diagnoseConnectionError = (err) => {
  const errMsg = err.message || '';
  const errCode = err.code || '';
  const errName = err.name || 'Error';

  console.error(`[MongoDB] Connection attempt failed: ${errName}${errCode ? ` [Code: ${errCode}]` : ''}`);

  if (errCode === 8000 || /bad auth|Authentication failed|auth failed/i.test(errMsg)) {
    console.error('[MongoDB] Category: AUTHENTICATION FAILURE');
    console.error('[MongoDB] -> The database user credentials in MONGODB_URI were rejected.');
    console.error('[MongoDB] -> Verify database username and password in MongoDB Atlas (Security -> Database Access).');
    console.error('[MongoDB] -> If the password contains special characters (@, :, /, %, etc.), ensure they are URL-encoded.');
  } else if (/querySrv/i.test(errMsg) || errCode === 'ENOTFOUND' || /getaddrinfo/i.test(errMsg)) {
    console.error('[MongoDB] Category: DNS / HOSTNAME RESOLUTION FAILURE');
    console.error('[MongoDB] -> Unable to resolve the Atlas cluster hostname.');
    console.error('[MongoDB] -> Verify the cluster domain in MONGODB_URI (e.g. cluster0.xxxxx.mongodb.net).');
  } else if (errName === 'MongooseServerSelectionError' || /timed? ?out|ECONNREFUSED|unreachable/i.test(errMsg)) {
    console.error('[MongoDB] Category: NETWORK TIMEOUT / IP ACCESS RESTRICTION');
    console.error('[MongoDB] -> Connection to MongoDB Atlas timed out.');
    console.error('[MongoDB] -> Check MongoDB Atlas -> Network Access -> IP Access List.');
    console.error('[MongoDB] -> Render uses dynamic IPs, so Atlas must allow access from anywhere (0.0.0.0/0).');
  } else {
    console.error('[MongoDB] Category: GENERAL CONNECTION ERROR');
    console.error(`[MongoDB] -> Details: ${maskMongoUri(errMsg)}`);
  }
};

/**
 * Connects to MongoDB with bounded retries and helpful diagnostic reporting.
 */
const connectDB = async (maxRetries = 3, retryDelayMs = 2000) => {
  // If already connected (e.g. in test environment), return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = getMongoUri();

  if (!uri) {
    console.error('[MongoDB] Configuration Error: No MongoDB connection string found.');
    console.error('[MongoDB] Neither MONGODB_URI nor MONGO_URI is defined in environment variables.');
    console.error('[MongoDB] In Render: Dashboard -> Service -> Environment -> Add MONGODB_URI.');
    throw new Error('MONGODB_URI is not configured in environment variables');
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error('[MongoDB] Configuration Error: Invalid MongoDB connection string format.');
    console.error('[MongoDB] URI must begin with "mongodb://" or "mongodb+srv://".');
    throw new Error('Invalid MongoDB connection string scheme');
  }

  const isAtlas = uri.startsWith('mongodb+srv://');
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`[MongoDB] Connecting to ${isAtlas ? 'Atlas cluster' : 'database'} (attempt ${attempt}/${maxRetries})...`);

      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
      });

      console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      diagnoseConnectionError(error);

      // Do not retry on authentication failures as they cannot succeed without config change
      const isFatalAuth = error.code === 8000 || /bad auth|Authentication failed|auth failed/i.test(error.message);
      if (isFatalAuth || attempt >= maxRetries) {
        throw error;
      }

      console.log(`[MongoDB] Retrying in ${retryDelayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
};

module.exports = connectDB;
