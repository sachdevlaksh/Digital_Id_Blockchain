/* Angular Module Definition */
var myApp = angular.module("myModule",  ['ngTable']);

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
    return $http({
      method: 'POST',
      url: uploadUrl,
      data: fd,
      transformRequest: angular.identity,
      headers: {
        'Content-Type': undefined
      }
    }).then(function successCallback(response) {
			return response;
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

  $scope.Back = function () {
	$window.location.href = '/student_portal.html';
  }

  $scope.Logout = function () {
	window.close();
  }
  
  var document = {
	_id : uniqueId + '-IdProof',
	docName : "",
	docType : "Identification Proof",
	digitalId : uniqueId + ''
  }

  var digitalIdData = {
    digitalId: "D-" + uniqueId,
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
	txnMsg: ""
  };

  var applicantData = {
    _id: uniqueId + '',
    digitalIdInfo: digitalIdData,
    digitalIdStatus: false,
    universityAdmissionStatus: false,
    currentDegreeStatus: false,
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

  $scope.on = function () {
	document.getElementById("overlay").style.display = "block";	  
  }

  $scope.off = function () {
	document.getElementById("overlay").style.display = "none";	  
  }

  $scope.Back = function () {
	$window.location.href = '/student_portal.html';
  }
  
  $scope.technicalSkills = ["Big Data Analysis", "Coding and Programming", "Project Management", "Social Media Experience", "Technical Writing"];
  
}]);


/* Apply For University Controller */
myApp.controller('applyUniversity', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.Back = function () {
	$window.location.href = '/student_portal.html';
  }
  
  $scope.on = function () {
	document.getElementById("overlay").style.display = "block";	  
  }

  $scope.off = function () {
	document.getElementById("overlay").style.display = "none";	  
  }
  
  $scope.loadDigitalIdData = function() {
	var data = {
	  _id : $scope.digitalId
	}
	
    $http({
      method: 'POST',
      url: '/getDigitalIdData',
	  data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
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

  }
  
}]);

/* Digital Id Admin Login Controller */
myApp.controller('digitalIdAdminLogin', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {
	
  $scope.courses = ["Ancient History", "Micro Services", "Computer Science"];
  
  $scope.degreeType = ["Under Graduate", "Post Graduate"];

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
        window.location.href = '/digital_id_admin.html';
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
      userId: $scope.username,
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

/* University Success Controller */
myApp.controller('universityAdmin', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

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

/* University Success Controller */
myApp.controller('digitalIdAdmin', ['$scope', '$http', '$window', 'NgTableParams', function($scope, $http, $window, NgTableParams) {

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
  
}]);

/* Digital Id Read Only Form Controller */
myApp.controller('digitalIdReadOnlyForm', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  var data = {
	_id : $window.sessionStorage.getItem("_id") 
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
  
  $scope.updateDigitalIdData = function (buttonValue) {
	var message = $scope.digitalIdData.message + " The digital id request has been " + buttonValue + ".";
	$scope.digitalIdData.message = message;
	
	if(buttonValue == "Approved")
		$scope.digitalIdData.digitalIdStatus = true;
	
    $http({
      method: 'POST',
      url: '/updateDigitalIdData',
	  data: $scope.digitalIdData
    }).then(function successCallback(response) {
      if(response.data.success == true) {
		$window.location.href = '/digital_id_admin.html';       
      } else {
        alert(response.data.message);
      }
    });	  
  }

  $scope.Back = function () {
	$window.location.href = '/digital_id_admin.html';
  }

  $scope.Logout = function () {
	window.close();
  }
   
}]);

/* Digital Id Read Only Form Controller */
myApp.controller('universityReadOnlyForm  ', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  var data = {
	_id : $window.sessionStorage.getItem("_id") 
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
  
  $scope.updateDigitalIdData = function (buttonValue) {
	var message = $scope.digitalIdData.message + " The university admission request has been " + buttonValue + ".";
	$scope.digitalIdData.message = message;
	
	if(buttonValue == "Approved")
		$scope.digitalIdData.universityAdmissionStatus = true;
	
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

  $scope.Back = function () {
	$window.location.href = '/university_admin.html';
  }

  $scope.Logout = function () {
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