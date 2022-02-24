const requestIp = require("request-ip");
const Photo = require("../models/photo.model");
const Voter = require("../models/Voter.model");

/****** SUBMIT PHOTO ********/
const clean = (arg) => {
  return arg.replace(/<[^>]*>?/gm, "");
};
const validateEmail = (email) => {
  const regex = /[A-z]+\.*[A-z]+@[A-z]+\.[A-z]/g;
  return regex.test(email);
};

exports.add = async (req, res) => {
  try {
    let { title, author, email } = req.fields;
    const file = req.files.file;
    title = clean(title); //clean from html tags
    author = clean(author); //clean from html tags

    if (title && author && email && file && validateEmail(email)) {
      // if fields are not empty and email is gramatically correct...

      const imageExts = ["png", "jpg", "jpeg", "webp"];
      const fileName = file.path.split("/").slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const imageExt = fileName.split(".")[1];

      console.log(imageExts.indexOf(imageExt));
      if (imageExts.indexOf(imageExt) < 0) {
        //if file extension is different then specific
        throw new Error("Wrong input!");
      }
      const newPhoto = new Photo({
        title,
        author,
        email,
        src: fileName,
        votes: 0,
      });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
    } else {
      throw new Error("Wrong input!");
    }
  } catch (err) {
    res.status(500).send(err.toString());
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).send(err.toString());
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) res.status(404).json({ message: "Not found" });
    else {
      const clientIP = requestIp.getClientIp(req);
      // console.log(req.ip);
      const voter = await Voter.findOne({ user: clientIP });
      if (!voter) {
        const createdUser = await Voter.create({
          user: clientIP,
          votes: [photoToUpdate._id],
        });
        // console.log("created user!: ", createdUser);
      } else {
        // console.log("voter exists: ", voter.user, voter.votes);
        if (voter.votes.includes(photoToUpdate._id)) {
          // console.log("voter voted");
          // console.log("his votes: ", voter.votes);
          throw new Error("A vote has been sent from user IP");
        } else {
          // console.log("thats first time");
          // console.log("his votes: ", voter.votes);
          voter.votes.push(photoToUpdate._id);
          console.log(await voter.save());
        }
      }
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: "OK" });
    }
  } catch (err) {
    res.status(500).send(err.toString());
  }
};
