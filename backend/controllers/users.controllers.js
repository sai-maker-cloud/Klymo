const { UserServices } = require("../services/index.services");
const {User} = require("../models/index.models");
const cloudinary = require('cloudinary').v2;

const addUser = async (req, res) => {
    try {
        const { username, bio, gender, interests, avatarUrl } = req.body;

        const newUser = new User({
            username,
            bio,
            gender,
            interests
        });

        if (avatarUrl) {
            const uploadRes = await cloudinary.uploader.upload(avatarUrl, {
                folder: "aegis_avatars",
                public_id: `avatar_${newUser._id}`,
                overwrite: true
            });
            newUser.avatar = uploadRes.secure_url;
        }

        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const deleteUser = async (req, res) => {
    try {
        const userData = req.body;
        const userId = userData._id || userData.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID required for deletion'
            });
        }

        try {
            await cloudinary.uploader.destroy(`aegis_avatars/avatar_${userId}`);
        } catch (cloudErr) {
            console.error("Cloudinary Delete Warning:", cloudErr);
        }

        await UserServices.deleteUser(userData);

        return res.status(200).json({
            success: true,
            message: 'User and assets deleted successfully'
        });
    } catch (err) {
        console.error("Delete Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { addUser, deleteUser };