var express = require('express');
var path = require('path');
var fs = require('fs');
var md5File = require('md5-file');
var bodyParser = require('body-parser');
var port = process.env.PORT || process.env.VCAP_APP_PORT || '8080';
var nano = require('nano')('http://localhost:' + port);
var app = express();
var multer = require('multer');
var nodemailer = require('nodemailer');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var upload = multer({ dest: __dirname + '/upload' });
var type = upload.single('file');

app.use('/', express.static(__dirname + '/'));
app.use('/', express.static(__dirname + '/images'));

var cloudantUserName = '97db821e-87a4-4507-b8ee-fcc95b72b447-bluemix';
var cloudantPassword = 'ae34609f865eac5720a3e08c9c0208840a9418090a98f9a4c1fcb9fa5573040b';
var dbCredentials_url = 'https://' + cloudantUserName + ':' + cloudantPassword + '@' + cloudantUserName + '.cloudant.com'; // Set this to your own account

//Initialize the library with my account
var cloudant = require('cloudant')(dbCredentials_url);

var dbForLogin = cloudant.db.use('digital_id_login_details');
var dbForApplicantData = cloudant.db.use('digital_id_applicant_data');
var dbForApplicantDocs = cloudant.db.use('digital_id_applicant_documents');

//Starting page when server starts
app.get('/', function(req, res) {
  console.log('Open index.html page');
  res.sendFile(path.join(__dirname + '/index.html'));
});

//Create index on applicant db for digitalIdStatus field if not existing
var digitalIdStatus = { name: 'digitalIdStatus', type: 'json', index: { fields: ['digitalIdStatus'] } };
dbForApplicantData.index(digitalIdStatus, function(er, response) {
  if(er)
    console.log('Error creating index on digital id status : ' + er);
  else
    console.log('Index creation result on digital id status : ' + response.result);
});

//Create index on applicant db for universityAdmissionStatus field if not existing
var universityAdmissionStatus = { name: 'universityAdmissionStatus', type: 'json', index: { fields: ['universityAdmissionStatus'] } };
dbForApplicantData.index(universityAdmissionStatus, function(er, response) {
  if(er)
    console.log('Error creating index on university admission status : ' + er);
  else
    console.log('Index creation result on university admission status : ' + response.result);
});

//Create index on applicant db for ssn field if not existing
var ssn = { name: 'ssn', type: 'json', index: { fields: ['ssn'] } };
dbForApplicantData.index(ssn, function(er, response) {
  if(er)
    console.log('Error creating index on ssn : ' + er);
  else
    console.log('Index creation result on ssn : ' + response.result);
});

//Create index on document db for digitalId if not existing
var digitalId = { name: 'digitalId', type: 'json', index: { fields: ['digitalId'] } };
dbForApplicantDocs.index(digitalId, function(er, response) {
  if(er)
    console.log('Error creating index on digitalId : ' + er);
  else
    console.log('Index creation result on digitalId : ' + response.result);
});

//Create index on applicant db for digitalId if not existing
var digitalId = { name: 'digitalId', type: 'json', index: { fields: ['digitalId'] } };
dbForApplicantData.index(digitalId, function(er, response) {
  if(er)
    console.log('Error creating index on digitalId : ' + er);
  else
    console.log('Index creation result on digitalId : ' + response.result);
});

//Verify admin login data from DB
app.post('/verifyLogin', function(req, res) {
	console.log('Inside Express api check for login');
	console.log('Received login details : ' + JSON.stringify(req.body));
    var userName = req.body.username;
    var password = req.body.password;
    dbForLogin.get(userName, function(err, body) {
        if (!err) {
            var dbPassword = body.agentPassword;
            if (dbPassword === password) {
				console.log('User verification successful');
				res.json({ success: true, message: 'User Authentication Successful' });
            } else {
				console.log('Error finding user Information from db ' + err);
				res.json({ success: false, message: 'Invalid User name/Password !' });
            }
        } else {
			  console.log('User name not found !');
			  res.json({ success: false, message: 'User name not found !' });
		}
    });
});

//Add digital Id data to DB
app.post('/addDigitalDataToDB', type, function(req, res) {
  console.log('Inside Express api to insert data for applicant');
  console.log('Received applicant details : ' + JSON.parse(JSON.stringify(req.body.data)));
  console.log('Recieved file details : ' + JSON.stringify(req.file));
  var applicantData = JSON.parse(JSON.stringify(req.body.data));
  applicantData = JSON.parse(applicantData);

  fs.readFile(__dirname + '/upload/' + req.file.filename, function(err, data) {
          dbForApplicantData.find({ selector: { ssn: applicantData.ssn } }, function(er, result) {
                if(er) {
                  console.log('Issue fetching SSN from DB ! ' + er);
                  res.json({ success: false, message: 'Error : ' + er });
                }
                if(result && result.docs && result.docs.length > 0) {
                  console.log('SSN already exists in DB !');
                  res.json({ success: false, message: 'SSN already exists in DB !'});
                } else {
                  console.log('SSN does not exists in DB !');
                  dbForApplicantData.insert(applicantData, function(err, body) {
                        if(!err) {
                          console.log(body);
                          dbForApplicantDocs.insert(applicantData.digitalIdInfo.documentDetails, function(err, body) {
                                if(!err) {
                                  console.log(body);
                                  dbForApplicantDocs.attachment.insert(body.id, req.file.originalname, data, req.file.mimetype, { rev: body.rev }, function(err, body) {
                                        if(!err) {
                                          fs.unlink(__dirname + '/upload/' + req.file.filename, function(err) {
                                                if(!err)
                                                  console.log('File deleted !');
                                                else
                                                  console.log('Issue deleting File');
                                          });
                                          console.log('Document uploaded successfully !');
                                          res.send({ success: true, message: 'Document uploaded successfully !' });
                                        } else {
                                          console.log('Document upload issue !');
                                          res.send({ success: false, message: 'Document upload issue !' });
                                        }
                                  });
                                } else {
                                  console.log('Applicant data insertion issue ! ' + err);
                                  res.send({ success: false, message: 'Applicant data insertion issue !' });
                                }
                          });
                        } else {
                          console.log('Applicant data insertion issue ! ' + err);
                          res.send({ success: false, message: 'Applicant data insertion issue !' });
                        }
                  });
                }
          });
  });
});

//Get all digital Ids with digital Id status as 'PENDING'
app.get('/getDigitalIdRequests', function(req, res) {
  console.log('Inside Express api check to get all applicants details for digital Id');
  dbForApplicantData.find({ selector: { digitalIdStatus: 'Pending' } }, function(er, result) {
    if(er) {
      console.log('Error finding applicant information from db ' + er);
      res.json({ success: false, message: 'Error : ' + er });
    }
    if(result && result.docs && result.docs.length > 0) {
      console.log('Data found !');
      res.json({ success: true, message: 'Data found !', result: result.docs });
    } else {
      console.log('Data not found !');
      res.json({ success: false, message: 'Data not found !' });
    }
  });
});

//Get all digital Ids with digital Id status as 'Approved' and universityStatus as 'Pending'
app.get('/getDigitalIdRequestsForAssessment', function(req, res) {
  var response ;
  console.log('Inside Express api check to get all applicants details for digital Id');
  dbForApplicantData.find({ selector: { digitalIdStatus: 'Approved' } }, function(er, result) {
    if(er) {
      console.log('Error finding applicant information from db ' + er);
      res.json({ success: false, message: 'Error : ' + er });
    }
    if(result && result.docs && result.docs.length > 0) {
      console.log('Data found !'+ JSON.stringify(result.docs));
	  for(var i=0; i<result.docs.length; i++){
		if(result.docs[i].universityAdmissionStatus === 'Pending' && result.docs[i].skillSetStatus === 'Pending')
			response = response.push(result.docs[i]);
	  }
      res.json({ success: true, message: 'Data found !', result: response });
    } else {
      console.log('Data not found !');
      res.json({ success: false, message: 'Data not found !' });
    }
  });
});

//Get all digital Ids with university application status as 'PENDING'
app.get('/getUniversityApplicantRequests', function(req, res) {
  console.log('Inside Express api check to get all applicants details for university applications');
  dbForApplicantData.find({ selector: { universityAdmissionStatus: 'Pending' } }, function(er, result) {
    if(er) {
      console.log('Error finding applicant information from db ' + er);
      res.json({ success: false, message: 'Error : ' + er });
    }
    if(result && result.docs && result.docs.length > 0) {
      console.log('Data found !');
      res.json({ success: true, message: 'Data found !', result: result.docs });
    } else {
      console.log('Data not found !');
      res.json({ success: false, message: 'Data not found !' });
    }
  });
});

//Get selected _id details from DB
app.post('/getDigitalIdData', function(req, res) {
  console.log('Inside Express api check to get digital Id data : ' +req.body._id);
/*   var transporter = nodemailer.createTransport({
	  service: 'gmail',
	  auth: {
		user: 'youremail@gmail.com',
		pass: 'yourpassword'
	  }
  });
  
  var mailOptions = {
	  from: 'youremail@gmail.com',
	  to: 'myfriend@yahoo.com',
	  subject: 'Sending Email using Node.js',
	  text: 'That was easy!'
  }; */
  
  dbForApplicantData.find({ selector: { _id: req.body._id } }, function(er, result) {
    if(er) {
      console.log('Error finding applicant information from db ' + er);
      res.json({ success: false, message: 'Error : ' + er });
    }
    if(result && result.docs && result.docs.length > 0) {
      console.log('Data found !');
      res.json({ success: true, message: 'Data found !', result: result.docs });
    } else {
      console.log('Data not found !');
      res.json({ success: false, message: 'Data not found !' });
    }
  });
});

//Update digital Id applicant details to DB
app.post('/updateDigitalIdData', function(req, res) {
  console.log('Inside Express api check to update digital Id data : ' +JSON.stringify(req.body));
  var applicantData = JSON.parse(JSON.stringify(req.body));
   dbForApplicantData.insert(applicantData, function(err, body) {
        if(!err) {		
          console.log('Applicant data updated successfully ! ' + err);
/* 		  transporter.sendMail(mailOptions, function(error, info){
			  if (error) {
				console.log(error);
			  } else {
				console.log('Email sent: ' + info.response);
			  }
		  }); */
          res.send({ success: true, message: 'Applicant data updated successfully ! ' });
          } else {
          console.log('Applicant data updation issue ! ' + err);
          res.send({ success: false, message: 'Applicant data updation issue !' });
        }
  });
});

// Update existence record in cloudant DB
var updateCloudantData = async (data) => {
   dbForApplicantData.insert(data, function(err, body) {
        if(!err) {		
          console.log('Applicant data updated successfully ! ' + err);
          return({ success: true, message: 'Applicant data updated successfully ! ' });
        } else {
          console.log('Applicant data updation issue ! ' + err);
          return({ success: false, message: 'Applicant data updation issue !' });
        }
  });		
}

// Insert data/record in cloudant DB
var insertCloudantData = async (data) => {
  dbForApplicantData.find({ selector: { ssn: data.ssn } }, function(er, result) {
		if(er) {
		  console.log('Issue fetching SSN from DB ! ' + er);
		  return({ success: false, message: 'Error : ' + er });
		}else if(result && result.docs && result.docs.length > 0) {
		  console.log('SSN already exists in DB !');
		  return({ success: false, message: 'SSN already exists in DB !'});
		}else {
		  console.log('SSN does not exists in DB !');
		  dbForApplicantData.insert(data, function(err, body) {
			if(!err) {
			  console.log('Applicant Data Inserted !' + body);
			  return({ success: true, message: 'Applicant Data Inserted Successfully !'});
			} else {
			  console.log('Applicant data insertion issue ! ' + err);
			  return({ success: false, message: 'Applicant data insertion issue !' });
			}
		  });
		}
  });		
}

// Insert Document in cloudant DB
var insertDocInCloudant = async (data, file) => {
  dbForApplicantDocs.insert(data, function(err, body) {
	if(!err) {
	  console.log('Document related data inserted successfully !' + body);
	  dbForApplicantDocs.attachment.insert(body.id, file.originalname, data, file.mimetype, { rev: body.rev }, function(err, body) {
			if(!err) {
			  fs.unlink(__dirname + '/upload/' + file.filename, function(err) {
					if(!err)
					  console.log('File deleted !');
					else
					  console.log('Issue deleting File');
			  });
			  console.log('Document uploaded successfully !');
			  return({ success: true, message: 'Document uploaded successfully !' });
			} else {
			  console.log('Document upload issue !');
			  return({ success: false, message: 'Document upload issue !' });
			}
	  });
	} else {
	  console.log('Document related data insertion issue ! ' + err);
	  return({ success: false, message: 'Document related data insertion issue !' });
	}
  });		
}

// Trigger mail to user/applicant
var triggerEmail = async (receiverEmailId, subject, mailBody) => {
	var transporter = nodemailer.createTransport({
	 service: 'gmail',
	 auth: { user: 'studentdigitalid@gmail.com', pass: 'ctsadmin' }
	});
	const mailOptions = {
	  from: 'studentdigitalid@gmail.com',
	  to: receiverEmailId,
	  subject: subject,
	  html: mailBody
	};
	transporter.sendMail(mailOptions, function (err, info) {
	   if(err)
		console.log('Issues triggering mail to applicant ! ' + err);
		return({ success: false, message: 'Issues triggering mail to applicant ! ' });
	   else
		console.log('Mail triggered successfully to applicant' + info);
		return({ success: false, message: 'Mail triggered successfully to applicant !' });
	});
}

app.listen(port);