const Event = require("../models/Event");

const imagePath = (filename) => `/uploads/events/${filename}`;

// =====================================
// CREATE EVENT
// =====================================

const createEvent = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Event title is required" });
    }

    const thumbnail =
      req.files?.thumbnail?.[0]?.filename ||
      req.body.thumbnail ||
      "";

    if (!thumbnail) {
      return res.status(400).json({ message: "Event thumbnail is required" });
    }

    const morePhotos = (req.files?.morePhotos || []).map((f) =>
      imagePath(f.filename)
    );

    const event = await Event.create({
      title: title.trim(),
      description: (description || "").trim(),
      thumbnail: thumbnail.startsWith("/uploads")
        ? thumbnail
        : imagePath(thumbnail),
      morePhotos,
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================
// LIST EVENTS (recent first)
// =====================================

const getEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10);

    let query = Event.find().sort({ createdAt: -1 });

    if (!Number.isNaN(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const events = await query.lean();

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================
// SINGLE EVENT DETAIL
// =====================================

const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(500).json({ message: error.message });
  }
};

// =====================================
// UPDATE EVENT
// =====================================

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (req.body.title !== undefined) {
      if (!req.body.title.trim()) {
        return res.status(400).json({ message: "Event title is required" });
      }
      event.title = req.body.title.trim();
    }

    if (req.body.description !== undefined) {
      event.description = req.body.description.trim();
    }

    if (req.files?.thumbnail?.[0]) {
      event.thumbnail = imagePath(req.files.thumbnail[0].filename);
    }

    if (req.files?.morePhotos?.length) {
      event.morePhotos = req.files.morePhotos.map((f) => imagePath(f.filename));
    }

    await event.save();

    res.status(200).json({ success: true, event });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(500).json({ message: error.message });
  }
};

// =====================================
// DELETE EVENT
// =====================================

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
};