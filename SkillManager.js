var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.container = finesse.container || {};
clientLogs = finesse.cslogger.ClientLogger || {};  // for logging

/** @namespace */
finesse.modules = finesse.modules || {};

finesse.modules.SkillManager = (function ($) {

      var user,
      
      xmlfile = "",finalXmlFile="",
      
      selectedUser = "",

      
      //akce = "get_Resource",
       //get_Resource , get_Skills, update_Resource
       
       skilly = new Array(),
       
       loadedSkills,
       
    _handleSystemInfoLoad = function(sysinfo) {
        clientLogs.log("in _handleSystemInfoLoad.");
        var text = sysinfo.getDeploymentType();
        var isLoad = sysinfo.isLoaded();
        var status = sysinfo.getStatus();
        var domain = sysinfo.getXmppDomain();
        var pubsub = sysinfo.getXmppPubSubDomain();
        var timestamp = sysinfo.getCurrentTimestamp();
        var single = sysinfo.isSingleNode();
        //var thishost = sysinfo.getThisHost(host);
        text = text;
        text = text + " " + isLoad._loaded + " " + status + " " + domain + " " + pubsub + " " + timestamp + " " + single + " ";
        clientLogs.log("sysinfo: "+text);

    },
    _handleSystemInfoChange = function(sysinfo) {
        clientLogs.log("in _handleSystemInfoChange.");
        var text = sysinfo.getDeploymentType();
        var isLoad = sysinfo.isLoaded();
        var status = sysinfo.getStatus();
        var domain = sysinfo.getXmppDomain();
        var pubsub = sysinfo.getXmppPubSubDomain();
        var timestamp = sysinfo.getCurrentTimestamp();
        var single = sysinfo.isSingleNode();
        //var thishost = sysinfo.getThisHost(host);
        text = text + " " + isLoad._loaded + " " + status + " " + domain + " " + pubsub + " " + timestamp + " " + single + " ";
        clientLogs.log("sysinfo: "+text);

    };   
       
    handleUserLoad = function(userevent) {
        clientLogs.log("handleUserLoad): in method");
        finesse.modules.SkillManager.loadSkills();
        finesse.modules.SkillManager.loadTeams();

    },
      
        handleUserChange = function(userevent) {
          clientLogs.log ("handleUserChange): in method");      
        },
        
        handleUserError = function(userevent){
           clientLogs.log ("handleUserError): in method");  
        },

       updateResourceSuccess = function(rsp) {
        clientLogs.log ("updatedResourceSuccess(): in method");
        //$('#result2 p').text(rsp.content);
        $('#result2').text("Nastaveni SKILL agenta upraveno");
        $("#menu [privdata*='ulozit']").hide();
        $('#select_resource').val(selectedUser).removeClass('unsaved');
        
        gadgets.window.adjustHeight();
       },


       loadResourceSuccess = function(rsp) {
        clientLogs.log ("loadResourceSuccess(): in method");
        //$('#result2 p').text(rsp.content);
        $('#result2').text("Uspesne nacten seznam agentu");
        finesse.modules.SkillManager.createSouhrn(user.getTeamName(),rsp.content);
        finesse.modules.SkillManager.parseAdminXml(rsp.content);
        //$("#menu [privdata*='ulozit']").show();
        
        
        gadgets.window.adjustHeight();
        
       },
       
       loadSkillsSuccess = function(rsp) {
        clientLogs.log ("loadSkillSuccess(): in method");
        $('#result2').text("Povedlo se nahrat seznam SKILL ze serveru");
        var xmlDoc = $.parseXML(rsp.content),
         $xml = $(xmlDoc);
         loadedSkills = xmlDoc;
         clientLogs.log ("loadSkillSuccess(): loadedSkills: "+loadedSkills);
         //var result = '';
         //var value ='';
         
         $xml.find("skill").each(function(index) {
            var $skill = $(this);
            var skillName = $skill.find("skillName").text();
            clientLogs.log ("loadSkillSuccess(): skillName: " + skillName);
            var skillId = $skill.find("self").text();
            skilly[skillName] = skillId;
            
           
            clientLogs.log ("loadSkillSuccess(): in method" + skilly[skillName]);
            
            $("#skill_list").append("<button onclick=finesse.modules.SkillManager.changestate('" + skillName + "'); privdata=" + skillName + ">" + skillName + "</button>");
            
             var curTeam = user.getTeamName();
            clientLogs.log ("loadSkillSuccess(): curTeam: " + curTeam);
            // foolowing is specific version for cpost. It allows to show only specific skills per supervisor team. This skill are selected by the begining of their name
            /*if (curTeam.indexOf("Brno") > -1) {
               $("#skill_list [privdata*='C_']").hide();
               $("#skill_list [privdata*='Z_']").hide();
            } else {
              $("#skill_list [privdata*='H_']").hide();
              $("#skill_list [privdata*='Z_']").hide();
            }*/
            
        });
       

        gadgets.window.adjustHeight();
       },

    makeWebServiceError = function(rsp) {
        clientLogs.log("makeWebServiceError(): in method");
        clientLogs.log("makeWebServiceError():" + rsp.content);
        $('#result2').text("Selhala komunikace se serverem, kontaktuje pros�m administr�tora syst�mu");
    },
    
    loadTeamsSuccess = function(rsp) {
        clientLogs.log ("loadTeamSuccess(): in method");
        $('#result2').append("Povedlo se nahrat seznam Teamu ze serveru");
        var xmlDoc = $.parseXML(rsp.content),
        $xml = $(xmlDoc);
        var content = "";
        var curTeam = user.getTeamName();
        $xml.find("team").each(function(index) {
            var $team = $(this);
            var teamname = $team.find("teamname").text();
            if (teamname === user.getTeamName()){
                content +="<option selected='selected' value='" + teamname + "'>" + teamname + "</option>";
            } else {
                content +="<option value='" + teamname + "'>" + teamname + "</option>";
            }
            
        });
        //clientLogs.log("loadTeamSuccess(): vysledek " + content);
        $("#select_team").html(content);
         
       
        
    };
    
    
 // #############################################################################

/*------------------------------------------------------------------------------------------------------------------------------        */

    return {
        
    prepareXmlFile : function(seluser,xml) {
           clientLogs.log ("prepareXmlFile(): zobrazuji nabidku agentu");
           selectedUser = seluser;
           var xmlDoc = $.parseXML(xml),$xml = $(xmlDoc);
          
           xmlfile = "<resource>";
           
           
           
           
            $xml.find("resource").each(function(index) {
             
                var $resource2 = $( this );
              
                
                if ($resource2.find("userID").text() === selectedUser){
                   //clientLogs.log ("prepareXmlFile(): na�el jsem selected user " + selectedUser);
                    xmlfile = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><resource>";
                    xmlfile += "<self>" + $resource2.find("self").text() + "</self>";
                    xmlfile += "<userID>" + $resource2.find("userID").text() + "</userID>";
                    xmlfile += "<firstName>" + $resource2.find("firstName").text() + "</firstName>";
                    xmlfile += "<lastName>" + $resource2.find("lastName").text() + "</lastName>";
                    xmlfile += "<extension>" + $resource2.find("extension").text() + "</extension>";
                    xmlfile += "<alias>" + $resource2.find("alias").text() + "</alias>";
                   
                    xmlfile += "<autoAvailable>" + $resource2.find("autoAvailable").text() + "</autoAvailable>";
                    xmlfile += "<type>" + $resource2.find("type").text() + "</type>";
                    xmlfile += "<team name=\"" + $resource2.find("team").attr("name") + "\">";
                    $resource2.find("team").each(function(index) {
                        var $myTeam = $(this);
                        xmlfile += "<refURL>" + $myTeam.find("refURL").text() + "</refURL></team>";
                    });
                   
                    if ($resource2.find("resourceGroup").text().length > 1) {
                        xmlfile += "<resourceGroup name=\"" + $resource2.find("resourceGroup").attr("name") + "\">";
                        $resource2.find("resourceGroup").each(function(index){
                            var $myResourceGroup = $(this); 
                            xmlfile += "<refURL>" + $myResourceGroup.find("refURL").text() + "</refURL></resourceGroup>";
                        });
                    }
                   
                  
                  
  
                   //clientLogs.log ("prepareXmlFile(): xmlfile: " + xmlfile);
                 
                }
                   //clientLogs.log ("prepareXmlFile(): selected user: " + selectedUser);
                    $("#skill_list [privdata]").removeClass("aktivni");
                    $("#skill_list ." + selectedUser).addClass("aktivni");
                    //clientLogs.log ("prepareXmlFile(): menim na aktivni " + selectedUser);
                
            })},    
  //################################################################################################  
    // dokoncuje XML file pro update pridanim zvolenim SKILL
    makeXmlFile: function () {
        var skillUpdate = "<skillMap>";
        
        $("#skill_list .x" + selectedUser).each(function(index){
           var skillNameTemp = $(this).text();
           clientLogs.log(" makeXmlFile(): testuji uzivatele na x" + skillNameTemp);
           if ($("#skill_list [privdata=" + skillNameTemp + "]").hasClass('x'+selectedUser)) {
              clientLogs.log(" makeXmlFile(): in method" + skillNameTemp + " x" + selectedUser); 
              $("#skill_list [privdata=" + skillNameTemp + "]").removeClass('x'+selectedUser);
              $("#skill_list [privdata=" + skillNameTemp + "]").addClass(selectedUser); 
           }
         });
         $("#skill_list .y" + selectedUser).each(function(index){
           var skillNameTemp = $(this).text();
           clientLogs.log(" makeXmlFile(): testuji uzivatele na y" + skillNameTemp);
           if ($("#skill_list [privdata=" + skillNameTemp + "]").hasClass('y'+selectedUser)) {
              clientLogs.log(" makeXmlFile(): in method" + skillNameTemp + " y" + selectedUser); 
              $("#skill_list [privdata=" + skillNameTemp + "]").removeClass('y'+selectedUser);
              $("#skill_list [privdata=" + skillNameTemp + "]").removeClass(selectedUser); 
           }
         });
        
        
        $("#skill_list ." + selectedUser).each(function(index){
            var skillName = $(this).text();
            clientLogs.log(" makeXmlFile(): in method" + skillName);
            skillUpdate += "<skillCompetency>";
            skillUpdate += "<competencelevel>5</competencelevel>";
            skillUpdate += "<skillNameUriPair name=\"" + skillName + "\">";
            skillUpdate += "<refURL>" + skilly[skillName] + "</refURL>";
            skillUpdate += "</skillNameUriPair>";
            skillUpdate += "</skillCompetency>";
        });
        
        skillUpdate += "</skillMap></resource>";
        
        finalXmlFile = xmlfile + skillUpdate;
        
 // ######################################################################################     
        
    },  
    // funkce meni styl tlacitka se skillem kdyz bylo stisknuto
    changestate : function (pressedButton) {
            clientLogs.log(pressedButton + " changestate(): in method");
            //$('#result button').remove(':contains(hlaska.val)');
            
            $('#skill_list [privdata|=' + pressedButton + ']').toggleClass('aktivni');
            if ($('#skill_list [privdata|=' + pressedButton + ']').hasClass('aktivni')) {
               $('#skill_list [privdata|=' + pressedButton + ']').addClass('x' + selectedUser);
               $('#skill_list [privdata|=' + pressedButton + ']').removeClass('y' + selectedUser); 
            } else {
               $('#skill_list [privdata|=' + pressedButton + ']').addClass('y' + selectedUser);
               $('#skill_list [privdata|=' + pressedButton + ']').removeClass('x' + selectedUser);
            }
            $("#menu [privdata*='ulozit']").show();
            
            $('#result2').text("Nastaveni zmeneno, ale neulozeno");
          

    },
    //Alternativni AJAX pro XML PUT, kdy� nefungoval gadget.io s ceskymi znaky
    xmlPut: function (url,document){
       clientLogs.log ("xmlPut(): in method " + url);
       clientLogs.log ("xmlPut(): in method " + document);
       
      $.ajax({
          type: 'PUT',	
	  url: url,	
	 headers: {	
	    "Authorization": "Basic Y2N4YWRtaW46UDBzdGFjQGs=",
            "Content-Type": "application/xml"
	 },
         dataType: 'xml',	
	 data: document,	
	 success: function(xhr){
             clientLogs.log ("xmlPut(): success ");
             
             updateResourceSuccess(xhr);
         },
         error: function (xhr,textStatus,error){	
	   clientLogs.log ("xmlPut(): error " + xhr.responseText);
           clientLogs.log ("xmlPut(): error " + textStatus);
           clientLogs.log ("xmlPut(): error " + error);
           $('#result2').text("Nastal probl�m s ulo�en�m SKILL agentovi, kontaktujte administr�tora syst�mu");
         }
    });
       
    },
    //###############################################################################
    //vytvori souhrnou tabulku agent� a prirazen�ch skill�
    createSouhrn: function(myTeam,xml){
        clientLogs.log ("createSouhrn(): in method" + xml);
        var xmlDoc = $.parseXML(xml),
        $xml = $(xmlDoc),
        $lskills = $(loadedSkills);
        var selectedTeam = $("#select_team").val();
        clientLogs.log ("createSouhrn(): selectedTeam: " + selectedTeam);
        var thHeader="";
        var countThHeader =0;
        var souhrnTable = "";
       
        var sortedAgents = new Array();
        $xml.find("resource").each(function(index) {
            var $resource = $(this);
            var userID = $resource.find("userID").text();
            var prijmeni = $resource.find("lastName").text();
            var jmeno = $resource.find("firstName").text();
            //clientLogs.log ("createSouhrn(): find userID : " + userID + " " + index + " " + prijmeni + " " + jmeno);
            sortedAgents[index] = prijmeni + " " + jmeno;
        });
        sortedAgents = sortedAgents.sort();
        sortedAgents.forEach(function (value,key){
            clientLogs.log ("createSouhrn(): in method " + value + " " + key);
            
            $xml.find("resource").each(function(index) {
                var $resource = $(this);
                var prijmeni = $resource.find("lastName").text();
                var jmeno = $resource.find("firstName").text();
                
                
                var agentTeam = $resource.find("team").attr("name");
                clientLogs.log ("createSouhrn(): porovnavam  " + value + " proti " + prijmeni + " " + jmeno);
                if (value === (prijmeni + " " + jmeno)){
                    var agentName = prijmeni + " " + jmeno;
                    var userID = $resource.find("userID").text();
                    clientLogs.log ("createSouhrn(): myteam + agent team " + myTeam + " " + agentTeam);
                    if (selectedTeam.indexOf(agentTeam) > -1){
                        souhrnTable += "<tr class='" + userID + "'><td>" + agentName + "</td>";
                                               
                        $lskills.find("skill").each(function(index) {
                            
                            var $skill = $(this);
                            var skillName = $skill.find("skillName").text(); 
                            if (countThHeader == 0){
                                thHeader+="<th>"+skillName+"</th>";
                            }
                            clientLogs.log("createSouhrn() skillName : " + skillName); 
                            souhrnTable += "<td class='" + skillName + " " + userID + "'>" + skillName + "</td>";
                            
                        });   
                        countThHeader =1;
                        souhrnTable += "</tr>";
                        clientLogs.log("createSOuhrn(): " + souhrnTable);
                    }
                }
            });
        });
        souhrnTable = "<table><tr><th>Agent</th>"+ thHeader + "<tr>" + souhrnTable;
        souhrnTable += "</table>"; 
        $("#souhrn table").replaceWith(souhrnTable);
    },
          
          
  //################################################################################        
    /* 
     * Nasleduj�c� funkce po nahr�n� agent� vytvori seznam agent� pro vyber a zobrazenym skilum 
     * prid� CLASS podle nastaveni agent�
     * 
     */
    parseAdminXml: function (xml) {
      clientLogs.log ("parseAdminXml(): in method");
      var xmlDoc = $.parseXML(xml),
     
      $xml = $(xmlDoc);
      var result = '';
      var value ='';
      var count;
      
      
      $xml.find("resource").each(function(index) {

                var $resource = $(this);
                
                var team = $resource.find("team").attr("name");

                var extension = $resource.find("extension").text();
                var firstName = $resource.find("firstName").text();
                var lastName = $resource.find("lastName").text();
                var userID = $resource.find("userID").text();
                $("#skill_list ." + userID).removeClass(userID); 
                
                //clientLogs.log ("parseAdminXml(): in method aktualni userId: " + user.getId() + " " + user.getTeamName());               
                //if (team.indexOf(user.getTeamName()) > -1) {
                if (team.indexOf($("#select_team").val()) > -1){
                  
                  if (userID === user.getId()) {
                    result += "<option selected='selected' value='" + userID + "'>" + lastName + " " + firstName + "</option>";
                  } else {
                    result += "<option value='" + userID + "'>" + lastName + " " + firstName + "</option>";  
                  }

                  
                  $resource.find("skillCompetency").each(function(index2) {
                    var $skillCompetency = $(this);
                    var skill = $skillCompetency.find("skillNameUriPair").attr("name");
                    //clientLogs.log ("parseAdminXml(): " + skill);
                    //$("#skill_list").append("<p class=" + userID + ">" + skill + "</p>");
                    $("#skill_list [privdata=" + skill + "]").addClass(userID);
                    $("#souhrn td." + userID + "." + skill).addClass("active");
                   
                    
                    //clientLogs.log ("parseAdminXml(): Pridavam Class wehre " + skill + " -- " + userID);
                      
                  });
               } else {
                  //clientLogs.log ("parseAdminXml():" + userID + " neni Brno");
               };
      //   }
        });
       //Setridi seznam AGENTU podle textu
       $("#select_resource").html(result).hide();

         var my_options = $("#select_resource option");
         var selected = $("#select_resource").val();

         my_options.sort(function(a,b) {
            if (a.text > b.text) return 1;
            if (a.text < b.text) return -1;
        return 0;
        });

        $("#select_resource").empty().append( my_options ).show();
        $("#select_resource").val(selected,xml);
       
       // priprav cast XML souboru pro update, zatim bez SKILL
        finesse.modules.SkillManager.prepareXmlFile(selected,xml);
        
        
        
        $("#select_resource").change(function () {
            selected = $(this).val();
            $('#result2').text("Pripraven dalsi agent k editaci");
            $("#menu [privdata*='ulozit']").hide(); 
            
            $("#skill_list .x" + selectedUser).each(function(index){
              var skillNameTemp = $(this).text();
                $("#skill_list [privdata*=" + skillNameTemp + "]").removeClass('x'+selectedUser);
             });
             $("#skill_list .y" + selectedUser).each(function(index){
              var skillNameTemp = $(this).text();
                $("#skill_list [privdata*=" + skillNameTemp + "]").removeClass('y'+selectedUser);
             });
            
            
            finesse.modules.SkillManager.prepareXmlFile(selected,xml);
        }); 
            
           
    },
    

    
/*----------------------------------------------------------------------------------*/
       createNewWebServicesRequest : function (action,handlers) {
            clientLogs.log("createNewWebServicesRequest(): in method--- ");
            var contentBody = {};
            handlers = handlers || {};

            if (action.match('get_Skills')) {
              clientLogs.log("createNewWebServicesRequest(): get_Skills--- ");
              finesse.gadget.include.myrestRequest("/adminapi/skill", {
                method: 'GET',
                success: handlers.success,
                error: handlers.error,
                content: contentBody,
                conttype : "XML"

            });
            };
            if (action.match('get_Teams')) {
              clientLogs.log("createNewWebServicesRequest(): get_Skills--- ");
              finesse.gadget.include.myrestRequest("/adminapi/team", {
                method: 'GET',
                success: handlers.success,
                error: handlers.error,
                content: contentBody,
                conttype : "XML"

            });
            };
            if (action.match('get_Resource')) {
              clientLogs.log("createNewWebServicesRequest(): get_Resource--- ");
              finesse.gadget.include.myrestRequest("/adminapi/resource/", {
                method: 'GET',
                success: handlers.success,
                error: handlers.error,
                content: contentBody,
                conttype : "XML"

            });
            };

            if (action.match('update_Resource')) {
              clientLogs.log("createNewWebServicesRequest(): " + action + "--- ");
              //var xmlUpdate = $.parseXML(xmlfile);
              //clientLogs.log("createNewWebServicesRequest(): xmlfile pred odeslanim = " + xmlfile);
              this.makeXmlFile();
              //transform czech letters into HTML entity:
              var encodedStr = finalXmlFile.replace(/[\u00A0-\u017F]/gim, function(i) {
                        return '&#'+i.charCodeAt(0)+';';
              });
              
              finesse.gadget.include.myrestRequest("/adminapi/resource/" + selectedUser, {
                method: 'PUT',
                success: handlers.success,
                error: handlers.error,
                content : encodedStr,
                conttype : "XML"
            });
            // alternativni PUT pres AJAX:
             //  this.makeXmlFile();
              //this.xmlPut("https://kc1-ccx.centrum.cpost.cz/adminapi/resource/" + selectedUser, finalXmlFile); 
     

            };
            return this;
        },


/*------------------------------------------------------------------------------------------------------- */

        loadResource : function () {
            clientLogs.log("loadResource(): in method");
            var description = "Nahravam seznam Agentu ze serveru";
            $('#result2').text(description);

            var vyber = "<option value='Nacitam'>Nacitam.......</option>";
           

            $('#select_resource').html(vyber);
            //this.makeWebService();
            //akce = "get_Resource";
            this.createNewWebServicesRequest( "get_Resource",{
                success: loadResourceSuccess,
                error: makeWebServiceError
            });
        },
/*-----------------------------------------------------------------------------------------------------------------*/        
        loadSkills : function () {
            clientLogs.log("loadSkills(): in method");
            //akce = "get_Skills";
            this.createNewWebServicesRequest("get_Skills", {
                success: loadSkillsSuccess,
                error: makeWebServiceError
            });
        },
        
        
/*-----------------------------------------------------------------------------------------------------------------*/        
        loadTeams : function () {
            clientLogs.log("loadSkills(): in method");
            //akce = "get_Teams";
            this.createNewWebServicesRequest("get_Teams", {
                success: loadTeamsSuccess,
                error: makeWebServiceError
            });
        },


/*-----------------------------------------------------------------------------------------------------------------*/
        updateResource : function () {
            clientLogs.log("loadSkills(): in method");
            //akce = "update_Resource";
            this.createNewWebServicesRequest("update_Resource", {
                success: updateResourceSuccess,
                error: makeWebServiceError
            });
        },
        
/*--------------------------------------------------------------------------------------------------------------*/

        /**
         * Performs all initialization for this gadget
         */
        init : function () {
            var clientLogs = finesse.cslogger.ClientLogger;   // declare clientLogs
            var cfg = finesse.gadget.Config;
            //_util = finesse.utilities.Utilities;

            gadgets.window.adjustHeight("350");
            	
            
            systeminfo = new finesse.restservices.SystemInfo("",{
		onLoad: _handleSystemInfoLoad,
                onChange: _handleSystemInfoChange
            });
            // Initiate the ClientServices.  ClientServices are
            // initialized with a reference to the current configuration.
            finesse.clientservices.ClientServices.init(cfg);
            
            user = new finesse.restservices.User({
                id: cfg.id, 
                onLoad : handleUserLoad,
                onChange : handleUserChange,
                onLoadError : handleUserError
            });
            // Initiate the clientLogs. The gadget id will be logged as a part of the message
            clientLogs.init(gadgets.Hub, "SkillManager", cfg);
            clientLogs.log("init(): in method modified");

            $("#menu [privdata*='ulozit']").hide();
            $('#result2').text("Nejprve je nutne nacist agenty ze serveru. Kdykoliv chcete provest novou editaci SKILL, je vhodn� nejprve nacist aktulni stav");
            




        }
    };
}(jQuery));