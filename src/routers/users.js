const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const { welcomeEmail, cancellationEmail } = require('../emails/account');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        welcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch (e) {
        res.status(400);
        if (e.name === 'MongoError' && e.code === 11000) {
           res.send({
            errors:{message: 'Email already exists!'}
               });
          } else {
            res.send(e);
          }
    }
});

router.post('/users/login', async(req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        // res.send({user: user.toJSON(), token});
        res.send({user, token});
    } catch (e) {
        res.status(400).send({error: {message: e.message}});
        // console.log(e);
    }
});

router.get('/users/me', auth, async(req, res) => {
    res.send(req.user);
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

//getting a single user by ID endpoint is disabled

// router.get('/users/:id', async(req, res) => {
//     const _id = req.params.id;

//     try {
//         user = await User.findById(_id);
//         if(!user) {
//             return res.status(400).send({
//                 errors:{message: 'Requested user found!'}
//             }); 
//         }
//         res.send(user);
//     } catch (e) {
//         res.status(500).send(e);
//     }
// });

router.patch('/users/me', auth, async(req, res) => {
    const updates = Object.keys(req.body);
    const allowedOp = ['name', 'age', 'email', 'password'];
    const isValid = updates.every((update) => allowedOp.includes(update));

    if(!isValid) {
        return res.status(400).send({
            errors: {message: 'Invalid update request!'}
        });
    }

    try {
        // const user = await User.findById(req.user._id);

        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();

        //middleware not working when using findByIdAndUpdate()
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        //     new: true,
        //     runValidators: true
        // });

        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async(req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id);
        // if(!user) {
        //     return res.status(400).send({
        //         errors: {message: 'User not found!'}
        //     })
        // }

        await req.user.remove();
        cancellationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

const upload = multer({
    // dest: 'avatar',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Please choose an image!'));
        }

        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('userAvatar'), async(req, res) => {
    const modBbuffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = modBbuffer;
    await req.user.save();
    res.send({message: 'Avatar uploaded successfully!'});
}, (e, req, res, next) => {
    res.status(400).send({
        errors: {message: e.message}
    });
});

router.delete('/users/me/avatar', auth, async(req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send({message: 'Avatar removed successfully!'});
    } catch (e) {
        res.status(400).send(e);
    }
});

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar) {
            throw new Error('No image found in database!');
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(400).send({
            errors: {message: e.message}
        });
    }
});

module.exports = router ;
