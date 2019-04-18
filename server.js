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
var Cloudant = require('@cloudant/cloudant');
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
var cloudant_url = 'https://' + cloudantUserName + ':' + cloudantPassword + '@' + cloudantUserName + '.cloudant.com'; // Set this to your own account
var cloudant = Cloudant(cloudant_url);

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
	verifyCredentialsFromCloudant(req.body.username, req.body.password).then(function(data) {
	if(data.success){
		res.json ({success : true, message:'User name verified with password successfully !'});
	}else
		res.json ({success : false, message:'User name not found !'});
	});
});

//Add digital Id data to DB
app.post('/addDigitalDataToDB', type, function(req, res) {
  console.log('Inside Express api to insert data for applicant');
  var applicantData = JSON.parse(JSON.stringify(req.body.data));
  applicantData = JSON.parse(applicantData);

  fs.readFile(__dirname + '/upload/' + req.file.filename, function(err, response) {
	insertCloudantData(applicantData).then(function(data) {
	if(data.success){
		insertDocInCloudant(response, req.file, applicantData.digitalIdInfo.documentDetails).then(function(data) {
		if(data.success){
			fs.unlink(__dirname + '/upload/' + req.file.filename, function(err) {
				if(!err)
				  console.log('File deleted !');
				else
				  console.log('Issue deleting File');
			});
			res.json ({success : true, message:'Applicant data and document inserted successfully !'});
		}else
			res.json ({success : false, message:'Issue inserting applicant document !'});
		});
	}else
		res.json ({success : false, message:'Issue inserting applicant data !'});
	});
  });
});

//Get all digital Ids with digital Id status as 'PENDING'
app.get('/getDigitalIdRequests', function(req, res) {
  console.log('Inside Express api check to get all applicants details for digital Id');
	digitalIdWithPendingStatus().then(function(data) {
	if(data.success){
		res.json ({success : true, message:'Data found successfully ! ', result: data.result.docs});
	}else
		res.json ({success : false, message:'Cloudant db connectivity issue !'});
	});  
});

//Get all digital Ids with skill set status as 'Pending'
app.get('/getDigitalIdRequestsForAssessment', function(req, res) {
  console.log('Inside Express api check to get all applicants details with skillset status pending');
	digitalIdWithPendingSkillSetStatus().then(function(data) {
	if(data.success){
		res.json ({success : true, message:'Data found successfully ! ', result: data.result});
	}else
		res.json ({success : false, message:'Cloudant db connectivity issue !'});
	});
});

//Get all digital Ids with university application status as 'PENDING'
app.get('/getUniversityApplicantRequests', function(req, res) {
  console.log('Inside Express api check to get all applicants details for university applications');
	digitalIdWithPendingUniversityAdmissionStatus().then(function(data) {
	if(data.success){
		res.json ({success : true, message:'Data found successfully ! ', result: data.result});
	}else
		res.json ({success : false, message:'Cloudant db connectivity issue !'});
	});
});

//Get selected _id details from DB
app.post('/getDigitalIdData', function(req, res) {
  console.log('Inside Express api check to get digital Id data : ' +req.body._id);
	getDigitalIdData(req.body._id).then(function(data) {
	if(data.success){
		res.json ({success : true, message:'Applicant data found successfully ! ', result: data.response.docs});
	}else
		res.json ({success : false, message:'Cloudant db connectivity issue !'});
	});
});

//Update digital Id applicant details to DB
app.post('/updateDigitalIdData', function(req, res) {
  console.log('Inside Express api check to update digital Id data ! ');
  var applicantData = JSON.parse(JSON.stringify(req.body));
	updateCloudantData(applicantData).then(function(data) {
	if(data.success){
		res.json ({success : true, message:'Applicant data updated successfully ! '});
	}else
		res.json ({success : false, message:'Applicant data updation issue !'});
	});
});

//Fetch specific digitalId record from cloudant DB
var getDigitalIdData = async (digitalId) => {
	try{
		var response = await dbForApplicantData.find({ selector: { _id: digitalId } });
		console.log('Applicant data found successfully ! ');
        return({ success: true, message: 'Applicant data found successfully ! ', response: response });
	}catch(err) {		
        console.log('Applicant data not present/DB issue ! ' + err);
        return({ success: false, message: 'Applicant data not present/DB issue !' });
    }		
}

// Update existence record in cloudant DB
var updateCloudantData = async (data) => {
	try{
		var response = await dbForApplicantData.insert(data);
		console.log('Applicant data updated successfully ! ');
        return({ success: true, message: 'Applicant data updated successfully ! ' });
	}catch(err) {		
        console.log('Applicant data updation issue ! ' + err);
        return({ success: false, message: 'Applicant data updation issue !' });
    }		
}

// Fetch all digital Ids with pending digitalId status from cloudant DB
var digitalIdWithPendingStatus = async () => {
	try{
		var response = await dbForApplicantData.find({ selector: { digitalIdStatus: 'Pending' } });
		if(response && response.docs && response.docs.length > 0) {
		  console.log('Data found !');
		  return({ success: true, message: 'Data found !', result: response });
		} else {
		  console.log('Data not found !');
		  return({ success: false, message: 'Data not found !' });
		}    
	}catch(err) {
      console.log('Error finding details from db !' + err);
      return({ success: false, message: 'Error finding details from db !'});
    }		
}

// Fetch all digital Ids with pending skillSetStatus status from cloudant DB
var digitalIdWithPendingSkillSetStatus = async () => {
var finaldigitalIds = new Array();
	try{
		var response = await dbForApplicantData.find({ selector: { skillSetStatus: 'Pending' } });
		if(response && response.docs && response.docs.length > 0) {
		  console.log('Data found !');
		  for(var i=0; i<response.docs.length; i++){
			if(response.docs[i].digitalIdStatus === 'Approved' && response.docs[i].universityAdmissionStatus === 'Pending'){
				finaldigitalIds.push(response.docs[i]);
			}
		  }
		  return({ success: true, message: 'Data found !', result: finaldigitalIds });
		} else {
		  console.log('Data not found !');
		  return({ success: false, message: 'Data not found !' });
		}    
	}catch(err) {
      console.log('Error finding details from db !' + err);
      return({ success: false, message: 'Error finding details from db !'});
    }
}

// Fetch all digital Ids with pending universityAdmission status from cloudant DB
var digitalIdWithPendingUniversityAdmissionStatus = async () => {
var finaldigitalIds = new Array();
	try{
		var response = await dbForApplicantData.find({ selector: { universityAdmissionStatus: 'Pending' } });
		if(response && response.docs && response.docs.length > 0) {
		  console.log('Data found !');
		  for(var i=0; i<response.docs.length; i++){
			if(response.docs[i].digitalIdStatus === 'Approved' && response.docs[i].skillSetStatus === 'Approved'){
				finaldigitalIds.push(response.docs[i]);
			}
		  }
		  return({ success: true, message: 'Data found !', result: finaldigitalIds });
		} else {
		  console.log('Data not found !');
		  return({ success: false, message: 'Data not found !' });
		}    
	}catch(err) {
      console.log('Error finding details from db !' + err);
      return({ success: false, message: 'Error finding details from db !'});
    }
}

// Verify admin login credentials from cloudant DB
var verifyCredentialsFromCloudant = async (username, password) => {
	try{
		var response = await dbForLogin.get(username);
		console.log('Data found in db for the requested username');
		if (response.agentPassword === password) {
			console.log('User verification successful');
			return({ success: true, message: 'User Authentication Successful !' });
		} else {
			console.log('Invalid User name/Password ');
			return({ success: false, message: 'Invalid User name/Password !' });
		}
	}catch (err){
		console.log('Data not found in db for the requested username !' + err);
		return({ success: false, message: 'Data not found in db for the requested username !'});
	}
}

// Insert data/record in cloudant DB
var insertCloudantData = async (data) => {
	try{
		var response =  await dbForApplicantData.find({ selector: { ssn: data.ssn } });
		if(response && response.docs && response.docs.length > 0){
		  console.log('SSN already exists in DB !');
		  return({ success: false, message: 'SSN already exists in DB !'});		
		}else{
		  console.log('SSN does not exists in DB !');
		  var data = await dbForApplicantData.insert(data);
		  console.log('Applicant Data Inserted !');
		  return({ success: true, message: 'Applicant Data Inserted Successfully !'});		  
		}
	}catch(err) {
		console.log('Issue fetching/inserting data from DB ! ' + err);
		return({ success: false, message: 'Issue fetching/inserting data from DB !'});
	}
}

// Insert Document in cloudant DB
var insertDocInCloudant = async (data, file, docData) => {
	console.log(data);
	console.log(file);
	try{
		var response = await dbForApplicantDocs.insert(docData);
		console.log('Document related data inserted successfully !');
		var body = await dbForApplicantDocs.attachment.insert(response.id, file.originalname, data, file.mimetype, { rev: response.rev });
		console.log('Document inserted successfully !');
		return({ success: true, message: 'Document uploaded successfully !' });		
	}catch(err){
	  console.log('Document related data insertion issue ! ' + err);
	  return({ success: false, message: 'Document related data insertion issue !' });
	} 		
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
	try{
		var response = await transporter.sendMail(mailOptions);
		console.log('Mail triggered successfully to applicant' + info);
		return({ success: true, message: 'Mail triggered successfully to applicant !' });
	}catch(err){
		console.log('Issues triggering mail to applicant ! ' + err);
		return({ success: false, message: 'Issues triggering mail to applicant ! ' });
	}
}

app.listen(port);