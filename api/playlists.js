const express = require("express");
const router = express.Router();
module.exports = router;

const { authenticate } = require("./auth");
const prisma = require("../prisma");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { ownerId: req.user.id },
    });
    res.json(playlists);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  const { name, description, trackIds } = req.body;
  try {
    const tracks = trackIds.map((id) => ({ id }));
    const playlist = await prisma.playlist.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        tracks: { connect: tracks },
      },
      include: {
        owner: true,
        tracks: true,
      },
    });
    res.status(201).json(playlist);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  const { id } = req.params;
  try {
    const playlist = await prisma.playlist.findUniqueOrThrow({
      where: { id: +id },
      include: { tracks: true },
    });
    if (playlist.ownerId !== req.user.id) {
      next({ status: 403, message: "You do not own this playlist"});
    }

    res.json(playlist);
  } catch (e) {
    next(e);
  }
});