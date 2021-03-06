/* Angular Module Definition */
var myApp = angular.module("myModule", ['ngTable']);

/* File Upload Directive */
myApp.directive('fileModel', ['$parse', function($parse) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var model = $parse(attrs.fileModel);
      var modelSetter = model.assign;

      element.bind('change', function() {
        scope.$apply(function() {
          modelSetter(scope, element[0].files[0]);
        });
      });
    }
  };
}]);

/* File Upload Service */
myApp.service('fileUpload', ['$http', function($http) {
  this.uploadFileAndFieldsToUrl = function(file, data, uploadUrl) {
    var fd = new FormData();
    fd.append('file', file);
    fd.append('data', JSON.stringify(data));
    $http({
      method: 'POST',
      url: uploadUrl,
      data: fd,
      transformRequest: angular.identity,
      headers: {
        'Content-Type': undefined
      }
    }).then(function successCallback(response) {
      if(response.data.success == true && uploadUrl === '/addDigitalDataToDB') {
        window.location.href = '/digital_id_success.html';
      } else {
        alert(response.data.message);
      }
    });
  }
}]);

/* Main Portal Controller */
myApp.controller('mainPortal', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.studentPortal = function() {
    window.open('/student_portal.html', '_blank');
  }

  $scope.consortiumPortal = function() {
    window.open('/consortium_admin_login.html', '_blank');
  }

  $scope.skillAssessmentPortal = function() {
    window.open('/assessment_admin_login.html', '_blank');
  }

  $scope.universityPortal = function() {
    window.open('/university_admin_login.html', '_blank');
  }

}]);

/* Student Portal Controller */
myApp.controller('studentPortal', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.applyDigitalId = function() {
    window.location.href = '/apply_digital_id.html';
  }

  $scope.addSkillSets = function() {
    window.location.href = '/add_skill_sets.html';
  }

  $scope.applyUniversity = function() {
    window.location.href = '/apply_university.html';
  }

}]);

/* Apply For Digital Id Controller */
myApp.controller('applyDigitalId', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  var uniqueId = Date.now();

  $scope.Back = function() {
    $window.location.href = '/student_portal.html';
  }

  $scope.Logout = function() {
    window.close();
  }

  var document = {
    _id: uniqueId + '-IdProof',
    docName: "",
    docType: "Identification Proof",
    digitalId: uniqueId + ''
  }

  var digitalIdData = {
    digitalId: uniqueId + '',
    fullName: "",
    emailId: "",
    countrycode: "",
    ssn: "",
    mobileNumber: "",
    gender: "",
    address: "",
    createTimestamp: uniqueId,
    dateOfBirth: "",
    documentDetails: document,
    universityDetails: "",
    assessmentDetails: "",
    selectedSkillSet: "",
    txnMsg: ""
  };

  var applicantData = {
    _id: uniqueId + '',
    digitalIdInfo: digitalIdData,
    digitalIdStatus: 'Pending',
    universityAdmissionStatus: 'Pending',
    currentDegreeStatus: false,
    skillSetStatus: 'Pending',
    ssn: "",
    message: "",
    txnMsg: ""
  };

  $scope.applicantData = applicantData;

  $scope.$watch('myFile', function(newFileObj) {
    if(newFileObj)
      $scope.filename = newFileObj.name;
  });

  $scope.genderTypes = ["Male", "Female"];

  $scope.submitDigitalIdData = function() {
    var file = $scope.myFile;
    $scope.applicantData.digitalIdInfo.documentDetails.docName = file.name;
    $scope.applicantData.ssn = $scope.applicantData.digitalIdInfo.ssn;
    $scope.applicantData.message = "Record inserted successfully in Cloudant DB.";
    var uploadUrl = "/addDigitalDataToDB";
    fileUpload.uploadFileAndFieldsToUrl(file, $scope.applicantData, uploadUrl);
  }
}]);

/* Apply For Skill Set Assessment Controller */
myApp.controller('addSkillSets', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.on = function() {
    document.getElementById("overlay").style.display = "block";
  }

  $scope.off = function() {
    document.getElementById("overlay").style.display = "none";
  }

  $scope.Back = function() {
    $window.location.href = '/student_portal.html';
  }

  $scope.technicalSkills = ["Big Data Analysis", "Coding and Programming", "Project Management", "Social Media Experience", "Technical Writing"];

  $scope.loadDigitalIdData = function() {
    var data = {
      _id: $scope.digitalId,
          functionName : "fabric"
    }

    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true && response.data.result[0].digitalIdStatus == 'Approved' && response.data.result[0].skillSetStatus == 'Pending') {
        $scope.digitalIdData = response.data.result[0];
        $scope.dob = new Date(response.data.result[0].digitalIdInfo.dateOfBirth);
        $scope.off();
      } else {
        alert("You have already applied for skill sets.");
        window.close();
      }
    });
  }

  $scope.updateDigitalIdData = function() {
    var message = $scope.digitalIdData.message + " The applicant has added his skillsets successfully.";
    $scope.digitalIdData.message = message;

    $http({
      method: 'POST',
      url: '/updateDigitalIdData',
      data: $scope.digitalIdData
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $window.location.href = '/skill_set_add_success.html';
      } else {
        alert(response.data.message);
      }
    });
  }

}]);

/* Apply For University Controller */
myApp.controller('applyUniversity', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.courses = ["Ancient History", "Computer Science", "Microservices"];

  $scope.degreeTypes = ["UG", "PG"];

  $scope.Back = function() {
    $window.location.href = '/student_portal.html';
  }

  $scope.on = function() {
    document.getElementById("overlay").style.display = "block";
  }

  $scope.off = function() {
    document.getElementById("overlay").style.display = "none";
  }

  $scope.loadDigitalIdData = function() {
    var data = {
      _id: $scope.digitalId,
          functionName : "fabric"
    }

    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true && response.data.result[0].digitalIdStatus == 'Approved' && response.data.result[0].skillSetStatus == 'Approved') {
        $scope.digitalIdData = response.data.result[0];
        $scope.dob = new Date(response.data.result[0].digitalIdInfo.dateOfBirth);
        $scope.off();
      } else {
        alert(response.data.message);
        window.close();
      }
    });
  }

  $scope.addUniversityData = function() {
    var universityData = {
      universityName: $scope.selectedUniversityName,
      universityAddress: $scope.selectedUniversityAddress,
      universityId: $scope.selectedUniversityId,
      courseAppliedFor: $scope.selectedCourse,
      appliedDegreeType: $scope.selectedDegreeType,
      courseStartDate: '',
      courseEndDate: '',
      degreeCompleteStatus: false,
      digitalId: $scope.digitalIdData.digitalIdInfo.digitalId,
      registrationId: $scope.digitalIdData.digitalIdInfo.assessmentDetails.registrationId,
      universityDocument: ''
    };
    var univData = [];
    univData.push(universityData);
    var message = $scope.digitalIdData.message + " The applicant has added his university choices.";
    $scope.digitalIdData.message = message;
    $scope.digitalIdData.digitalIdInfo.universityDetails = univData;

    $http({
      method: 'POST',
      url: '/updateDigitalIdData',
      data: $scope.digitalIdData
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $window.location.href = '/university_success.html';
      } else {
        alert(response.data.message);
      }
    });
  }
}]);

/* Consortium Admin Login Controller */
myApp.controller('consortiumAdminLogin', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.verifyLogin = function() {

    var data = {
      username: $scope.username,
      password: $scope.password
    }

    $http({
      method: 'POST',
      url: '/verifyLogin',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        window.location.href = '/consortium_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

}]);

/* University Admin Login Controller */
myApp.controller('universityAdminLogin', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.verifyLogin = function() {

    var data = {
      username: $scope.username,
      password: $scope.password
    }

    $http({
      method: 'POST',
      url: '/verifyLogin',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        window.location.href = '/university_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

}]);

/* Assessment Admin Login Controller */
myApp.controller('assessmentAdminLogin', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.verifyLogin = function() {

    var data = {
      username: $scope.username,
      password: $scope.password
    }

    $http({
      method: 'POST',
      url: '/verifyLogin',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        window.location.href = '/assessment_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

}]);

/* University Success Controller */
myApp.controller('universityAdmin', ['$scope', '$http', '$window', 'NgTableParams', function($scope, $http, $window, NgTableParams) {

  $scope.getUniversityApplicantRequests = function() {
    $http({
      method: 'GET',
      url: '/getUniversityApplicantRequests'
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $scope.tableData = response.data.result;
        $scope.tableParams = new NgTableParams({
          count: 4
        }, {
          counts: [],
          dataset: $scope.tableData
        });
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.selectedDigitalId = function(digitalId) {
    $window.sessionStorage.setItem("_id", digitalId);
    $window.location.href = '/university_read_only.html';
  }

}]);

/* Consortium Admin DigitalId Requests Form Controller */
myApp.controller('consortiumAdmin', ['$scope', '$http', '$window', 'NgTableParams', function($scope, $http, $window, NgTableParams) {

  $scope.getDigitalIdRequests = function() {
    $http({
      method: 'GET',
      url: '/getDigitalIdRequests'
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $scope.tableData = response.data.result;
        $scope.tableParams = new NgTableParams({
          count: 4
        }, {
          counts: [],
          dataset: $scope.tableData
        });
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.selectedDigitalId = function(digitalId) {
    $window.sessionStorage.setItem("_id", digitalId);
    $window.location.href = '/digital_id_read_only.html';
  }

  $scope.Logout = function() {
    window.close();
  }

}]);

/* Assessment Admin Skill Set Requests Form Controller */
myApp.controller('assessmentAdmin', ['$scope', '$http', '$window', 'NgTableParams', function($scope, $http, $window, NgTableParams) {

  $scope.getDigitalIdRequestsForAssessment = function() {
    $http({
      method: 'GET',
      url: '/getDigitalIdRequestsForAssessment'
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $scope.tableData = response.data.result;
        $scope.tableParams = new NgTableParams({
          count: 4
        }, {
          counts: [],
          dataset: $scope.tableData
        });
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.selectedDigitalId = function(digitalId) {
    $window.sessionStorage.setItem("_id", digitalId);
    $window.location.href = '/add_skill_sets_read_only.html';
  }

  $scope.Logout = function() {
    window.close();
  }

}]);

/* Digital Id Read Only Form Controller */
myApp.controller('digitalIdReadOnlyForm', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  var data = {
    _id: $window.sessionStorage.getItem("_id"),
        functionName : "cloudant"
  }

  $scope.loadDigitalIdData = function() {
    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $scope.digitalIdData = response.data.result[0];
        $scope.dob = new Date(response.data.result[0].digitalIdInfo.dateOfBirth);
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.updateDigitalIdData = function(buttonValue) {
    var message = $scope.digitalIdData.message + " The digital id request has been " + buttonValue + ".";
    $scope.digitalIdData.message = message;

    if(buttonValue == "Approved")
      $scope.digitalIdData.digitalIdStatus = "Approved";

    if(buttonValue == "Rejected")
      $scope.digitalIdData.digitalIdStatus = "Rejected";

    var data = {
      data: $scope.digitalIdData,
      functionName: "createStudentRecord"
    }

    $http({
      method: 'POST',
      url: '/updateDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $window.location.href = '/consortium_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.Back = function() {
    $window.location.href = '/consortium_admin.html';
  }

  $scope.Logout = function() {
    window.close();
  }

}]);

/* Skill Set Read Only Form Controller */
myApp.controller('skillSetReadOnlyForm', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  var data = {
    _id: $window.sessionStorage.getItem("_id"),
        functionName : "cloudant"
  }

  $scope.loadDigitalIdData = function() {
    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $scope.digitalIdData = response.data.result[0];
        $scope.dob = new Date(response.data.result[0].digitalIdInfo.dateOfBirth);
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.updateDigitalIdData = function(buttonValue) {
    var uniqueId = Date.now();
    var assessmentDetails = {
      registrationId: uniqueId + '',
      assessmentUserAnswer: '',
      assessmentScore: '',
      digitalId: $scope.digitalIdData.digitalIdInfo.digitalId,
      assessmentDocument: ''
    };
    var message = $scope.digitalIdData.message + " The skill set based as per your profile has been " + buttonValue + ".";
    $scope.digitalIdData.message = message;
    var assessmentInfo = [];
    assessmentInfo.push(assessmentDetails);
    $scope.digitalIdData.digitalIdInfo.assessmentDetails = assessmentInfo;

    if(buttonValue == "Approved")
      $scope.digitalIdData.skillSetStatus = "Approved";

    if(buttonValue == "Rejected")
      $scope.digitalIdData.skillSetStatus = "Rejected";

    var data = {
      data: $scope.digitalIdData,
      functionName: "addAssessmentDetails"
    }

    $http({
      method: 'POST',
      url: '/updateDigitalIdData',
      data: $scope.digitalIdData
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $window.location.href = '/assessment_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.Back = function() {
    $window.location.href = '/assessment_admin.html';
  }

  $scope.Logout = function() {
    window.close();
  }

}]);

/* Digital Id Read Only Form Controller */
myApp.controller('universityReadOnlyForm', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  var data = {
    _id: $window.sessionStorage.getItem("_id"),
        functionName : "cloudant"
  }

  $scope.loadDigitalIdData = function() {
    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $scope.digitalIdData = response.data.result[0];
        $scope.dob = new Date(response.data.result[0].digitalIdInfo.dateOfBirth);
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.updateDigitalIdData = function(buttonValue) {
    var message = $scope.digitalIdData.message + " The university admission request has been " + buttonValue + ".";
    $scope.digitalIdData.message = message;

    if(buttonValue == "Approved")
      $scope.digitalIdData.universityAdmissionStatus = true;

    var data = {
      data: $scope.digitalIdData,
      functionName: "addUniveristyDetails"
    }

    $http({
      method: 'POST',
      url: '/updateDigitalIdData',
      data: $scope.digitalIdData
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        $window.location.href = '/university_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.Back = function() {
    $window.location.href = '/university_admin.html';
  }

  $scope.Logout = function() {
    window.close();
  }

}]);

/* Assessment Controller */
myApp.controller('assessment', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

}]);

/* University Success Controller */
myApp.controller('universitySuccess', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.closeTab = function() {
    window.close();
  }

}]);

/* Digital Id Success Controller */
myApp.controller('digitalIdSuccess', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.closeTab = function() {
    window.close();
  }

}]);

/* Add Skill Set Success Controller */
myApp.controller('skillSetSuccess', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.closeTab = function() {
    window.close();
  }

}]);
