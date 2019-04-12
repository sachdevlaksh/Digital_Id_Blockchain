var express = require('express');
var path = require('path');
var fs = require('fs');
var md5File = require('md5-file');
var bodyParser = require('body-parser');
var port = process.env.PORT || process.env.VCAP_APP_PORT || '8080';
var nano = require('nano')('http://localhost:' + port);
var app = express();
var multer = require('multer');
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

//Create index on login db for user name field if not existing
var username = { name: 'username', type: 'json', index: { fields: ['username'] } };
dbForLogin.index(username, function(er, response) {
  if(er)
    console.log('Error creating index on user name : ' + er);
  else
    console.log('Index creation result on user name : ' + response.result);
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

//Create index on applicant db for currentDegreeStatus field if not existing
var currentDegreeStatus = { name: 'currentDegreeStatus', type: 'json', index: { fields: ['currentDegreeStatus'] } };
dbForApplicantData.index(currentDegreeStatus, function(er, response) {
  if(er)
    console.log('Error creating index on current degree status : ' + er);
  else
    console.log('Index creation result on current degree status : ' + response.result);
});

//Create index on applicant db if not existing
var ssn = { name: 'ssn', type: 'json', index: { fields: ['ssn'] } };
dbForApplicantData.index(ssn, function(er, response) {
  if(er)
    console.log('Error creating index on ssn : ' + er);
  else
    console.log('Index creation result on ssn : ' + response.result);
});

//Verify admin login data from DB
app.post('/verifyLogin', function(req, res) {
  console.log('Inside Express api check for login');
  console.log('Received login details : ' + JSON.stringify(req.body));
  var logindetails = JSON.parse(JSON.stringify(req.body));
  dbForLogin.find({ selector: { username: logindetails.username } }, function(er, result) {
    if(er) {
      console.log('Error finding user Information from db ' + er);
      res.json({ success: false, message: 'Error : ' + er });
    }
    if(result && result.docs && result.docs.length > 0) {
      if(result.docs[0].username.toUpperCase() == logindetails.username.toUpperCase() && result.docs[0].agentPassword == logindetails.password) {
        console.log('User verification successful');
        res.json({ success: true, message: 'User Authentication Successful' });
      } else {
        console.log('Error finding user Information from db ' + er);
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
			  dbForApplicantDocs.insert(applicantData, function(err, body) {
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

//Get all digital Ids with digital Id status as false
app.get('/getDigitalIdRequests', function(req, res) {
  console.log('Inside Express api check to get all applicants details for digital Id');
  dbForApplicantData.find({ selector: { digitalIdStatus: false } }, function(er, result) {
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

//Get all digital Ids with university application status as false
app.get('/getUniversityApplicantRequests', function(req, res) {
  console.log('Inside Express api check to get all applicants details for university applications');
  dbForApplicantData.find({ selector: { universityAdmissionStatus: false } }, function(er, result) {
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
	  res.send({ success: true, message: 'Applicant data updated successfully ! ' });
	  } else {
	  console.log('Applicant data updation issue ! ' + err);
	  res.send({ success: false, message: 'Applicant data updation issue !' });
	}
  });
});

app.listen(port);