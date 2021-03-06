const sheetID = "1Dlg2fEtY3Er_a5wizMMggy-6-hpieWT2aLiF_Lxg5Xs";
const parentFolderId = '1lbcCk6w-UrSwkrYuvlHPJS6u7tcHHVf8';
const applicationTemplateID ='1HA2oRwVgovDAXKw-WwlHCHZkW-dMdQdf_4XD9mFZZeM';//this is not gopheresearch current template
//Each Application creates a folder: ApplicationID random for every page request - dont use Date - it creates different time points FolderName serves as a unique Application ID


 
/*
SEE ABOVE
MOVE SCRIPT TO GR ACCOUNT
ENSURE CORRECT SHEETS CHANGE FOLDERIDS... 

*/

function doGet(e) {
  //To get a prefilled form, pass url like this: ..url?filled=y&s=studentEmail&p=piEmail
  if(e.parameters.filled == 'y') {
    var pageTemp = HtmlService.createTemplateFromFile("applicationForm.html"); 
    pageTemp.studentEmail = e.parameter.s;    //s = student/user email
    pageTemp.piEmail = e.parameter.p;         //p = the lab email
    return HtmlService.createHtmlOutput(pageTemp.evaluate().getContent()) 
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

  var pageTemp = HtmlService.createTemplateFromFile("applicationForm.html"); 
  pageTemp.studentEmail = '';    //s = student/user email
  pageTemp.piEmail = '';         //p = the lab email
  return HtmlService.createHtmlOutput(pageTemp.evaluate().getContent())
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
}
 
//dont this need anymore SEND SUCCESS PAGE WITH THIS?
function doPost(e) {
 
 var data = Utilities.base64Decode(e.parameters.data);
 var blob = Utilities.newBlob(data, e.parameters.mimetype, e.parameters.filename);
 
 const pdfFolder = DriveApp.getFolderById("1lbcCk6w-UrSwkrYuvlHPJS6u7tcHHVf8");
 const pdfFile = pdfFolder.createFile(blob);
 
 var output = HtmlService.createHtmlOutput("<b>Done!</b>");
 output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
 return output;
 // return ContentService.createTextOutput("Done.") <--- Here, an error occurred.
 
}
 
function uploadFileToDrive(base64Data, fileName, folderName) {
 try{
   var splitBase = base64Data.split(','),
       type = splitBase[0].split(';')[0].replace('data:','');
 
   var byteCharacters = Utilities.base64Decode(splitBase[1]);
   var ss = Utilities.newBlob(byteCharacters, type);
   ss.setName(fileName);
 
     var parentFolder=DriveApp.getFolderById(parentFolderId); 
     var folder, folders = DriveApp.getFoldersByName(folderName);

     if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = parentFolder.createFolder(folderName); 
    }

      var file = folder.createFile(ss);
     
     //Finally, pass folder link - would be the best way to do it. 
 
   return file.getName();

  }
   
  catch(e){
   return 'Error: ' + e.toString();
  }
}

// Sample function that you want to run using Web Apps. - not in use
function processRequest(email) {
 var sheetActive = SpreadsheetApp.openById(sheetID);
 var ws = sheetActive.getSheetByName("Sheet1");
 ws.appendRow([email]);
}
 
function display(){
 var sheetActive = SpreadsheetApp.openById(sheetID);
 var ws = sheetActive.getSheetByName("Sheet1");
 var range = ws.getRange(ws.getLastRow(),1);
 return "You approved " + range.getValue();
 
}
 
function activeUser(){
  return Session.getActiveUser().getEmail();
}
 
function applicationHandler(rawData){
 
  const sheetActive = SpreadsheetApp.getActiveSpreadsheet();
  const ws = sheetActive.getSheetByName("Sheet1");
  var currentDate = new Date();
  
  //Push MergedPDF in applicant's folder 
  var mergedPDFLink = getMergedPDFLink(rawData);
  pushFile(mergedPDFLink,rawData.folder1);
  var fileLinks = getFileLinksFromFolder(rawData.folder1,rawData.totalUploads);
   
  //  sendEmail(rawData, fileLinks);
  var status = sendEmail(rawData, fileLinks, mergedPDFLink);

  // setFolderViewers
  


  ws.appendRow([
   currentDate,
   rawData.firstName.trim(),
   rawData.lastName.trim(),
   rawData.studentEmailAddress.trim(),
   rawData.piEmail.trim(),
   rawData.college.trim(),
   rawData.academicYear.trim(),
   rawData.academicMajor.trim(),
   rawData.minor.trim(),
   rawData.tellMeAboutYourself.trim(),
   rawData.interested.trim(),
   rawData.gain.trim(),
   rawData.goalsInterests.trim(),
   rawData.experience.trim(),
   rawData.addInformation.trim(),
   rawData.folder1,
   rawData.totalUploadSize,
   fileLinks,
   mergedPDFLink,
   status]
  );
  
  if(status == 'Error'){errorHandler(rawData,fileLinks,mergedPDFLink); return;}

}

function getMergedPDFLink(rawData){

  const pdfFolder = DriveApp.getFolderById("1g_xwN0-wb4mRWbbIOe2caQOW0BCnwHun");
  const tempFolder = DriveApp.getFolderById("1cvC38rVixuIjREF8mzPOOzWyYcrenWab");
  const template = DriveApp.getFileById(applicationTemplateID); 

  const newTempFile = template.makeCopy(tempFolder);
  const openDoc = DocumentApp.openById(newTempFile.getId());
  const body = openDoc.getBody();
  var paras = body.getParagraphs();

  body.replaceText("{First Name}", rawData.firstName.trim());
  body.replaceText("{Last Name}", rawData.lastName.trim());
  body.replaceText("{Student Email address}", rawData.studentEmailAddress.trim());
  body.replaceText("{Academic Major}", rawData.academicMajor.trim());
  if(rawData.minor == ''){
    paras[9].removeFromParent();
    paras[10].removeFromParent(); // should find these numbers dynamically - SEE TODOLIST
  }
  else{
    body.replaceText("{Minor}", rawData.minor.trim());
  }



  body.replaceText("{Academic Year}", rawData.academicYear.trim());
  body.replaceText("{College}", rawData.college.trim());
  body.replaceText("{PI Email}", rawData.piEmail.trim());
  body.replaceText("{Tell me about yourself}", rawData.tellMeAboutYourself.trim());
  body.replaceText("{Why are you interested in working with my lab}", rawData.interested.trim());
  body.replaceText("{What would you like to gain from working in the lab}", rawData.gain.trim());
  body.replaceText("{Describe your future career goals and/or project interests}", rawData.goalsInterests.trim());
  body.replaceText("{PI Email}", rawData.piEmail.trim());
  body.replaceText("{Relevant Experience and Coursework}", rawData.experience.trim());
  body.replaceText("{Additional Information}", rawData.addInformation.trim());

  openDoc.saveAndClose();

  const blobPDF = newTempFile.getAs(MimeType.PDF);
  const pdfFile = pdfFolder.createFile(blobPDF).setName(rawData.firstName.trim()+ "'s " + "Lab Application");
  tempFolder.removeFile(newTempFile);

  return pdfFile.getUrl();
}

function sendEmail(rawData, fileLinks, mergedPDFLink){ 
  try {
    var emailTemp = HtmlService.createTemplateFromFile("emailbody");
    emailTemp.StudentName = rawData.firstName.trim() + " " + rawData.lastName.trim();
    emailTemp.FolderLink = '';
    emailTemp.display = 'none';
    var htmlMessage = emailTemp.evaluate().getContent();
    attachmentfiles = []

    var fileIDs = getIdFromUrl(fileLinks);

    for (i = 0; i < fileIDs.length; i++) {
      file  = DriveApp.getFileById(fileIDs[i]);
      attachmentfiles.push(file); // How do we have the applicationpdf going in first?
    }

  //Attach Folderlink and PDF file only if attachments exceed 25MB Quota
    if(rawData.totalUploadSize > 22){
      attachmentfiles = [DriveApp.getFileById(getIdFromUrl(mergedPDFLink))];
      emailTemp.FolderLink = getfolderLink(rawData.folder1);
      emailTemp.display = 'inline';
      var htmlMessage = emailTemp.evaluate().getContent();
    }
    

    GmailApp.sendEmail(rawData.piEmail , "GopheResearch | Lab Application", "", 

      {
        cc: rawData.studentEmailAddress,
        bcc: 'gopheresearch@umn.edu',
        attachments: attachmentfiles,
        name: "GopheResearch | University of Minnesota",
        htmlBody: htmlMessage
      })
      return 'Success';
  }
 
  catch (e) {
    return "Error"; 
  }

} 

function getFileLinksFromFolder(folderName, totalUploads){

  
  if(folderName == null){return '';}// Handles no file submissions!

  while(true){if(totalUploads + 1 == getFileCount(folderName)){break;}} //+1 to account for the mergedPDF

  //We have to wait for google drive, oh my god. folders
  var folders = DriveApp.getFoldersByName(folderName)
  var fileList = '';
  while (folders.hasNext()) {
    var folder = folders.next();
    var files = folder.getFiles();
    
    while (files.hasNext()){
      file = files.next();
      fileList = fileList + file.getUrl() +', ';
    }
      var fileListClean = fileList.slice(0, -2);
  }
  return fileListClean;  

}

function pushFile(sourceFileLink,targetFolderName) {

  if(targetFolderName == null){}// Handles no file submissions!

  else{
    var folders = DriveApp.getFoldersByName(targetFolderName);

    while (folders.hasNext()) {
      var folder = folders.next();
      var targetFolderId = folder.getId();
    }
    
    var sourceFileId = sourceFileLink.match(/[-\w]{25,}/g);

    var file = DriveApp.getFileById(sourceFileId);
    var folder = DriveApp.getFolderById(targetFolderId);
    file.moveTo(folder);
  }
}

function folderExists(folderName) {
  //  if(folderName == null){return false;}
  var parent = DriveApp.getFolderById(parentFolderId);
  try {
    folder = parent.getFoldersByName(folderName);
    folder.next();
    return true;
  } 
  catch (e) {
    return false; 
  }
}

function getIdFromName(targetFolderName) {

    var folders = DriveApp.getFoldersByName(targetFolderName);

    while (folders.hasNext()) {
      var folder = folders.next();
      return folder.getId();
    }
    
  }

  function folderStatus(folderName){
    parentFolder.createFolder(folderName);
    while(!folderExists(folderName)){Logger.log('waiting');}
    return true;
  }

// Can remove alot of redundant code with a : getFolderID(folderName) function
function createFolder(folderName){
  var parentFolder = DriveApp.getFolderById(parentFolderId); 
  parentFolder.createFolder(folderName);

  while(true){
    if(folderExists(folderName)){return true;}
  }
}

function getFileCount(folderName){
  
  var count = 0;
  var folders = DriveApp.getFoldersByName(folderName);
    while (folders.hasNext()) {
      var folder = folders.next();
      var files = folder.getFiles();
      
      while (files.hasNext()){
        count = count + 1;
        file = files.next();
      }
    }
    
  return count;
}

function getIdFromUrl(url) { 
  return url.match(/[-\w]{25,}/g); 
}

function errorHandler(rawData,fileLinks,mergedPDFLink){
  Logger.log(rawData);
  Logger.log(fileLinks); 

  var count = 0;
  while(count < 10){
    if(sendEmail(rawData, fileLinks,mergedPDFLink) == "Success"){updateStatus(rawData.folder1); break;}   ///UPDATEROW //Is this actually sending an email
    count++;
  }

  if(count == 10){
    GmailApp.sendEmail('gopheresearch@umn.edu' , "Error! Error! Error!", "Houston, we have a problem. The following application cannot be sent, we tried 10 times...  " + getfolderLink(rawData.folder1), 
      {
        cc: 'qures072@umn.edu',
        name: "GopheResearch | University of Minnesota",
      })
  }
}

function updateStatus(applicationID){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  // HARDCODE - and we should change this to application id throughout
  var col = data[0].findIndex((name) => name === "Folder Name"); 

  for(var i = 0; i<data.length;i++){
    if(data[i][col] == applicationID){ 
      var row = i+1;
      sheet.getRange('S'+row).setValue('Success');
    }
  }
}

function getfolderLink(folderName) {

  var folders = DriveApp.getFoldersByName(folderName);
  while (folders.hasNext()) {
    var folder = folders.next();
    return folder.getUrl()
  }
}

//NOT USED - SHOULD NOT SEND AN INVITE EMAIL
//https://www.labnol.org/code/20101-share-files-google-drive-without-email-notifications
function setFolderViewers(folderName, emailsArray) {
  var folder = DriveApp.getFolderById(getIdFromName(folderName));
  folder.addViewers(emailsArray)
}

