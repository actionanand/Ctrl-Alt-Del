const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Task = require('../models/task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, 'Minimum length is 3'],
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid!');
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%?=*&]).{8,20}/;
            const commonPass = ['password', '123', 'qwe','abc','iloveyou','iluvu','iloveu','admin','098','987','000','111'];
            const temp = commonPass.filter(f => value.toLowerCase().includes(f));

            if (temp.length >= 1) {
                throw new Error(`Please don't use common passwords like qwe, 123, your name, etc inside the password!`);
            } else if(!regex.test(value)) {
                throw new Error('Password should be of min 8 char & max 20 char with atleast 1 digit, 1 lower and upper cases')
            }
        }
    },
    age: {
        type: Number,
        default: 18,
        validate(value) {
            if(value < 13) {
                throw new Error('Age must be more than 13!')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_TOKEN);
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token;
}

userSchema.methods.toJSON = function() {
    user = this;
    userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokens;
    delete userObj.avatar;
    
    return userObj;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found in Database, please sign up first!');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    // console.log(isMatch);

    if(!isMatch) {
        throw new Error('Please check your password, Try again!');
    }

    return user;
}

// Hash the plain text password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

//removing all tasks of a user when profile removed

userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User