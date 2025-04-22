const multer = require('multer');

const storageEngine = multer.diskStorage({
    destination:(req,file,cb) =>
    {
        console.log('Multer Storage Engine');
        if(file.fieldname==='profile')
            cb(null,'./storage/images/profile/')
        else if(file.fieldname==='image')
            cb(null,'./storage/images/teams');
        else if(file.fieldname==='policy')
          cb(null,'./storage/policies');
        else if(file.fieldname==='notice')
            cb(null,'./storage/notices');
        else if(file.fieldname==='excelsheet')
            cb(null,'./storage/excelsheet');
        else if(file.fieldname==='document')
            cb(null,'./storage/degree');
        else if(file.fieldname==='aadhar')
            cb(null,'./storage/degree/aadhar');
        else if(file.fieldname==='pan')
            cb(null,'./storage/degree/pan');

        else
            cb(null,false);
    },
    filename:(req,file,cb)=>
    {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + file.originalname);
    }
})


const fileFilter = (req,file,cb) =>{
    console.log('File Filter Method Called');
    console.log('Logging File '+file);
    if(file === 'undefined')
    {
        console.log('undefined hai')
        cb(null,false);
    }
    else if(file.fieldname==='image')
    {
        if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' ||file.mimetype === 'image/jpeg')
            cb(null,true)
        else
            cb(null,false)
    }
    else if(file.fieldname==='video')
    {
        if(file.mimetype==='video/mp4')
            cb(null,true)
        else
            cb(null,false)
    }
    else
        cb(null,false);
}


const upload = multer({storage:storageEngine});
module.exports = upload;