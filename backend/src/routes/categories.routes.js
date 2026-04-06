import { Router } from 'express';
import { list, create, update, remove } from '../controllers/categories.controller.js';
import Category from '../models/Category.js';

const r = Router();
r.get('/', async (_req, res) => {
  try {
    const cats = await Category.find({}, { _id: 1, name: 1 })
      .sort({ name: 1 })
      .lean();
    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

r.post('/', create);
r.put('/:id', update);
r.delete('/:id', remove);
export default r;