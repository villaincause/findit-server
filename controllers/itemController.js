import { pool } from '../config/db.js';

export const createItem = async (req, res) => {
  const {
    type,
    title,
    category,
    campus_location,
    date_occurred,
    description,
    contact_info,
    verification_question,
  } = req.body;

  if (!type || !title || !category || !campus_location || !date_occurred || !description || !contact_info) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  if (!['lost', 'found'].includes(type)) {
    return res.status(400).json({ message: 'Item type must be either lost or found.' });
  }

  const imageUrl = req.file ? req.file.path : null;

  try {
    const result = await pool.query(
      `INSERT INTO items (
        reporter_id,
        type,
        title,
        category,
        campus_location,
        date_occurred,
        description,
        contact_info,
        verification_question,
        image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.user.id,
        type,
        title.trim(),
        category.trim(),
        campus_location.trim(),
        date_occurred,
        description.trim(),
        contact_info.trim(),
        verification_question?.trim() || null,
        imageUrl,
      ]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ message: 'Failed to submit item report.' });
  }
};

export const getItems = async (req, res) => {
  const { type, category, location, date, search } = req.query;

  const conditions = [];
  const values = [];

  if (type && ['lost', 'found'].includes(type)) {
    values.push(type);
    conditions.push(`i.type = $${values.length}`);
  }

  if (category) {
    values.push(category);
    conditions.push(`i.category = $${values.length}`);
  }

  if (location) {
    values.push(`%${location.trim()}%`);
    conditions.push(`i.campus_location ILIKE $${values.length}`);
  }

  if (date) {
    values.push(date);
    conditions.push(`i.date_occurred = $${values.length}`);
  }

  if (search) {
    values.push(`%${search.trim()}%`);
    conditions.push(`(i.title ILIKE $${values.length} OR i.description ILIKE $${values.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT
        i.id,
        i.reporter_id,
        i.type,
        i.title,
        i.description,
        i.category,
        i.campus_location,
        i.date_occurred,
        i.image_url,
        i.verification_question,
        i.status,
        i.created_at,
        u.full_name AS reporter_name
      FROM items i
      JOIN users u ON i.reporter_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC`,
      values
    );

    res.json({ items: result.rows });
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ message: 'Failed to fetch items.' });
  }
};

export const getItemById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        i.id,
        i.reporter_id,
        i.type,
        i.title,
        i.description,
        i.category,
        i.campus_location,
        i.date_occurred,
        i.image_url,
        i.verification_question,
        i.status,
        i.created_at,
        u.full_name AS reporter_name
      FROM items i
      JOIN users u ON i.reporter_id = u.id
      WHERE i.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.json({ item: result.rows[0] });
  } catch (err) {
    console.error('Get item by ID error:', err);
    res.status(500).json({ message: 'Failed to load item details.' });
  }
};