import mongoose from 'mongoose';

const OPTS = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10,
};

export async function connectMongo(uri, retries = Infinity, delay = 5000) {
  mongoose.set('strictQuery', true);

  while (retries > 0) {
    try {
      await mongoose.connect(uri, OPTS);
      console.log('✅ MongoDB conectado:', mongoose.connection.host);

      mongoose.connection.on('error', err =>
        console.error('Mongo error:', err.message)
      );
      mongoose.connection.on('disconnected', () =>
        console.warn('Mongo desconectado')
      );

      return mongoose.connection;
    } catch (err) {
      console.error('❌ Fallo conexión Mongo:', err.message);
      retries--;
      if (retries === 0) throw err;           // no hagas process.exit
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

export async function closeMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('🛑 MongoDB cerrado');
  }
}
