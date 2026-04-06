import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import 'dotenv/config'


const { MONGO_URI } = process.env;
async function seedUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🟢 Conectado a MongoDB');

    const users = [
      {
        name: 'Administrador General',
        email: 'admin@demo.com',
        password: 'Admin123!',
        role: 'admin'
      },
      {
        name: 'Finanzas',
        email: 'finanzas@demo.com',
        password: 'Fin123!',
        role: 'fin'
      },
      {
        name: 'Visor',
        email: 'viewer@demo.com',
        password: 'View123!',
        role: 'viewer'
      }
    ];

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`⚠️ Usuario ${u.email} ya existe`);
        continue;
      }

      const passwordHash = await bcrypt.hash(u.password, 10);
      await User.create({ ...u, passwordHash });
      console.log(`✅ Usuario ${u.email} creado con rol ${u.role}`);
    }

    console.log('🌱 Seed completado');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error en la semilla:', err);
    process.exit(1);
  }
}

seedUsers();
