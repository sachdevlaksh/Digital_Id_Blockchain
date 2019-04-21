'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {
    // ================================================================================================================
   // The Init method is called when the Smart Contract 'digitalOnboarding' is instantiated by the blockchain network
  // ==================================================================================================================
  async Init(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('=========== Instantiated digitalOnboarding chaincode ===========');
    return shim.success();
  }

    // ================================================================================================================
   // The Invoke method is called as a result of an application request to run the Smart Contract 'digitalOnbaording'
  // ==================================================================================================================
  async Invoke(stub) {
    console.info('Transaction ID: ' + stub.getTxID());
    console.info(util.format('Args: %j', stub.getArgs()));

    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.log('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params, this);
	  console.log(payload);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  // =================================================
 //  Query Ledger For Student Details with digitalId
// ===================================================
  async queryStudentDetails(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting digitalId ex: 123456');
    }
    let digitalId = args[0];

    let studentAsBytes = await stub.getState(digitalId);
    if (!studentAsBytes || studentAsBytes.toString().length <= 0) {
      throw new Error(digitalId + ' does not exist: ');
    }
    console.log(studentAsBytes.toString());
    return studentAsBytes;
  }

  // ==========================================
 //  Query Ledger For All Txns with digitalId
// ============================================
  async queryAllDetailsForADigitalId(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting digitalId ex: 123456');
    }
    let digitalId = args[0];

    let studentAsBytes = await stub.getHistoryForKey(digitalId);
    if (!studentAsBytes || studentAsBytes.toString().length <= 0) {
      throw new Error(digitalId + ' does not exist: ');
    }
    console.log(studentAsBytes.toString());
    return studentAsBytes;
  }

  // =====================================
 //  Query Ledger For All Student Records
// =======================================
  async queryAllDigitalIdRecords(stub) {
    const startKey = '0';
    const endKey = '9999999999999999999';

    const iterator = await stub.getStateByRange(startKey, endKey);

    const allResults = [];
    while (true) {
        const res = await iterator.next();

        if (res.value && res.value.value.toString()) {
            console.log(res.value.value.toString('utf8'));

            const Key = res.value.key;
            let Record;
            try {
                Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                Record = res.value.value.toString('utf8');
            }
            allResults.push({ Key, Record });
        }
        if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allResults);
            return JSON.stringify(allResults);
        }
    }
  }

  // ==================================
 //  Query Ledger For All Universities
// ====================================
  async queryAllUniversityInfo(stub) {
    const startKey = 'U-0';
    const endKey = 'U-999999999999999999';

    const iterator = await stub.getStateByRange(startKey, endKey);

    const allResults = [];
    while (true) {
        const res = await iterator.next();

        if (res.value && res.value.value.toString()) {
            console.log(res.value.value.toString('utf8'));

            const Key = res.value.key;
            let Record;
            try {
                Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                Record = res.value.value.toString('utf8');
            }
            allResults.push({ Key, Record });
        }
        if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allResults);
            return JSON.stringify(allResults);
        }
    }
  }

  // =================================================
 //  Init Ledger To Instantiate Chaincode On Network
// ===================================================
  async initLedger(stub) {
    console.info('============= START : Initialize Ledger ===========');
    let documentInfo = {};
    let univeristyInfo = [];
        let assessmentInfo = [];
    let studentDetails = {};

    documentInfo._id = '';
        documentInfo.docName = '';
        documentInfo.docType = '';
        documentInfo.digitalId = '';

    univeristyInfo.push({
        univeristyName : 'Illinois University',
        univeristyAddress : 'London',
        univeristyId : 'U-1',
        courseAppliedFor : 'Microservices',
        appliedDegreeType : 'UG',
        courseStartDate : '12/12/2018',
        courseEndDate : '12/12/2020',
        degreeCompleteStatus: false,
        digitalId: '',
        registrationId: '',
        universityDocument: documentInfo
    });

    assessmentInfo.push({
        registrationId: '',
        assessmentUserAnswer: '',
        assessmentScore: '',
        digitalId: '',
        assessmentDocument: documentInfo
    });

    studentDetails.digitalId = '1550134215751';
    studentDetails.fullName = 'Prem Dutt';
    studentDetails.emailId = 'prem09jun@gmail.com';
    studentDetails.countrycode = '91';
    studentDetails.ssn = '965874123';
    studentDetails.mobileNumber = '9971480085';
    studentDetails.gender = 'Male';
    studentDetails.address = 'Delhi';
    studentDetails.createTimestamp = '1550134215751';
    studentDetails.dateOfBirth = '1992-06-08T18:30:00.000Z';
    studentDetails.document = documentInfo;
    studentDetails.univeristyDetails = univeristyInfo;
    studentDetails.assessmentDetails = assessmentInfo;
    studentDetails.selectedSkillSet = 'Coding and Programming';
    studentDetails.txnMsg = 'Init';

    let studentAsBytes = await stub.putState(studentDetails.digitalId, Buffer.from(JSON.stringify(studentDetails)));
    console.log("Response from the function :" +studentAsBytes)
    console.info('============= END : Initialize Ledger ===========');
    return studentAsBytes;
  }

  // =======================================
 //  Add Student Details Record Into Ledger
// =========================================
  async createStudentRecord(stub, args) {
    console.info('============= START : Create Student Records ===========');
    if (args.length != 15) {
      throw new Error('Incorrect number of arguments. Expecting 15');
    }

    let studentDetails = {};
    studentDetails.digitalId = args[0];
    studentDetails.fullName = args[1];
    studentDetails.emailId = args[2];
    studentDetails.countrycode = args[3];
    studentDetails.ssn = args[4];
    studentDetails.mobileNumber = args[5];
    studentDetails.gender = args[6];
    studentDetails.address = args[7];
    studentDetails.createTimestamp = args[8];
    studentDetails.dateOfBirth = args[9];
    studentDetails.document = args[10];
    studentDetails.univeristyDetails = args[11];
    studentDetails.assessmentDetails = args[11];
    studentDetails.selectedSkillSet = args[11];
    studentDetails.txnMsg = args[12];

    // ==== Check if student with digitalId already exists ====
    let digitalIdExist = await stub.getState(studentDetails.digitalId);
    if (digitalIdExist.toString()) {
      throw new Error('This student already exists: ' + digitalIdExist);
    }

    let studentAsBytes = await stub.putState(args[0], Buffer.from(JSON.stringify(studentDetails)));
    console.log("Response from the fuction :" +studentAsBytes)
    console.info('============= END : Create Student Record ===========');
    return studentAsBytes;
  }

  // ============================
 //  Add University Into Ledger
// ==============================
  async createUniversityRecord(stub, args) {
    console.info('============= START : Add University To Network ===========');
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    let universityDetails = {
        universityId: args[0],
        universityName: args[1],
        universityAddress: args[2]
    };

    // ==== Check if university with universityId already exists ====
    let universityIdExist = await stub.getState(universityDetails.universityId);
    if (universityIdExist.toString()) {
      throw new Error('This university already exists: ' + universityIdExist);
    }

    let studentAsBytes = await stub.putState(args[0], Buffer.from(JSON.stringify(universityDetails)));
    console.log("Response from the function :" +studentAsBytes)
    console.info('============= END : Add University To Network ===========');
    return studentAsBytes;
  }

  // =====================================================
 //  Add University Details To Student Record Into Ledger
// =======================================================
  async addUniveristyDetails(stub, args) {
    console.info('============= START : Add New Univeristy ===========');
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let studentAsBytes = await stub.getState(args[0]);
    let studentDetails = JSON.parse(studentAsBytes);
    studentDetails.univeristyDetails.push(args[1]);

    let studentAsBytes = await stub.putState(args[0], Buffer.from(JSON.stringify(studentDetails)));
    console.info('============= END : Add New Univeristy ===========');
    return studentAsBytes;
  }

  // =====================================================
 //  Add Assessment Details To Student Record Into Ledger
// =======================================================
  async addUniveristyDetails(stub, args) {
    console.info('============= START : Add Assessment Details ===========');
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let studentAsBytes = await stub.getState(args[0]);
    let studentDetails = JSON.parse(studentAsBytes);
    studentDetails.assessmentDetails.push(args[1]);

    let studentAsBytes = await stub.putState(args[0], Buffer.from(JSON.stringify(studentDetails)));
    console.info('============= END : Add Assessment Details ===========');
    return studentAsBytes;
  }

  // ========================================================
 //  Update University Details In Student Record Into Ledger
// ==========================================================
  async updateUniveristyDetails(stub, args) {
    console.info('============= START : Update Univeristy Details ===========');
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let studentAsBytes = await stub.getState(args[0]);
    let studentDetails = JSON.parse(studentAsBytes);
    if(studentDetails.univeristyDetails.length > 0){
        for(let i =0; i<studentDetails.univeristyDetails.length ; i++){
            if(studentDetails.univeristyDetails[i].univeristyId == args[1].univeristyId){
                studentDetails.univeristyDetails[i].courseEndDate = args[1].courseEndDate;
            }
        }
    }

    let studentAsBytes = await stub.putState(args[0], Buffer.from(JSON.stringify(studentDetails)));
    console.info('============= END : Update Univeristy Details ===========');
    return studentAsBytes;
  }

};

shim.start(new Chaincode());