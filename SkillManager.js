var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.container = finesse.container || {};
clientLogs = finesse.cslogger.ClientLogger || {};  // for logging
/** @namespace */
finesse.modules = finesse.modules || {};

finesse.modules.SkillManager = (function ($) {
    //var clientLogs = finesse.cslogger.ClientLogger;
    var user,cfg,
    xmlfile = "", finalXmlFile = "",
    selectedUser = "",
    //akce = "get_Resource",
    //get_Resource , get_Skills, update_Resource
    skilly = new Array(),
    loadedSkills,
    myTimer,
    //Object for time Ticker3
    alert = function(){
        //Gadget defined field: _lastProcessedTimerTick
        var _lastProcessedTimerTick = null,
        //Gadget defined field: _maxTimerCallbackThreshold
        _maxTimerCallbackThreshold = 500,
        //Gadget defined field: _forceTickProcessingEvery 
        _forceTickProcessingEvery = 5000,
        
        _tickActivated = false;
        /**
         * Processes a timer tick - updating the UI.
         * @param start is the time that the tick was received
         * @returns {boolean} true
         */
        var _processTick = function(start) {
            
            //clientLogs.log("alertarea number of nodes: "+ $('#alertarea div').length + "_tickActivated: "+_tickActivated);
            if ($('#alertarea div').length > 0){
                clientLogs.log("time over relese oldest message");
                //if there are some alerts, remove the oldest one and keep timer ticking
   
                $('#alertarea div :first').removeClass('lightSpeedIn');
                $('#alertarea div :first').addClass('animated fadeOutRight');
                $('#alertarea div :first').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                    $('#alertarea div :first').remove();
                });
               
            } else {
           
                clientLogs.log("time over relese timer");
                _lastProcessedTimerTick = null;
                myTimer.removeHandler(myTimer.Topics.TIMER_TICK_EVENT, myTicker);
                
                _tickActivated=false;
            }
             
            _lastProcessedTimerTick = start;  
            return true;
        },
        /**
         * Timer tick callback handler.
         * @param data
         */
        _timerTickHandler = function() {
            var start, end, diff, discardThreshold, processed;
            clientLogs.log("in _timertickHandler");
            start = (new Date()).getTime();
            processed = false;
             clientLogs.log("start="+start+" processed="+processed+" _lastProcessedTimerTick="+_lastProcessedTimerTick+" _forceTickProcessingEvery="+_forceTickProcessingEvery);
            //Prevent starvation of timer logic
            if (_lastProcessedTimerTick === null) {
                _lastProcessedTimerTick = start;
                //processed = _processTick(start);
            } else {
                if ((_lastProcessedTimerTick + _forceTickProcessingEvery) <= start) {
                    //Force processing at least every _forceTickProcessingEvery milliseconds
                    processed = _processTick(start);
                }
            }
            end = (new Date()).getTime();
            diff = end - start;
            if (diff > _maxTimerCallbackThreshold) {
                clientLogs.log("GadgetXYZ took too long to process timer tick (_maxTimerCallbackThreshold exceeded).");
            }
        },
        
        myTicker = function (timerTickEvent){
            clientLogs.log("Timer tick event");
            _tickActivated=true;
            _timerTickHandler();
        };       

        return {
            display: function(alerttext) {
                //alerttext in HTML form, delay in number of cycles defined in _forceTickProcessingEvery 
                clientLogs.log("_alert: " + alerttext);
                var finalAlert = "<div class=\"alert alert-success animated lightSpeedIn\" role=\"alert\">"+alerttext+"</div>";
                $('#alertarea').append(finalAlert);
                //$('#alertarea .alert').addClass('on');
                
                
                if (!_tickActivated) {
                    _lastProcessedTimerTick = null;
                    myTimer.addHandler(myTimer.Topics.TIMER_TICK_EVENT,myTicker);
                                    
                };
            }
            
        };

    }(),
    
    
    _handleSystemInfoLoad = function(sysinfo) {
        clientLogs.log("in _handleSystemInfoLoad.");
        var dtype = sysinfo.getDeploymentType();
        var isLoad = sysinfo.isLoaded();
        var status = sysinfo.getStatus();
        var domain = sysinfo.getXmppDomain();
        finesse.gadget.skillManager.appserver.ip = domain;
        var pubsub = sysinfo.getXmppPubSubDomain();
        var timestamp = sysinfo.getCurrentTimestamp();
        var single = sysinfo.isSingleNode();
        //var thishost = sysinfo.getThisHost(host);
        var text = dtype;
        text = text + " " + isLoad._loaded + " " + status + " " + domain + " " + pubsub + " " + timestamp + " " + single + " ";
        clientLogs.log("sysinfo: "+text);
        if (dtype === "UCCX") {
            $("#menu [privdata*='ulozit']").hide();
                        
            user = new finesse.restservices.User({
                id: cfg.id, 
                onLoad : handleUserLoad,
                onChange : handleUserChange,
                onLoadError : handleUserError
            
            });
        } else {
            $("#menu [privdata*='ulozit']").remove();
            $("#menu [privdata*='stahnout']").remove();
            $("#menu #select_team").remove();
            $("#menu #select_resource").remove();
            
            alert.display("This gadget is created only for UCCX systems. It can not be used with UCCE ");
        }   
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
        finesse.modules.SkillManager.loadResource();

    },
      
    handleUserChange = function(userevent) {
        clientLogs.log ("handleUserChange): in method");      
    },
        
    handleUserError = function(userevent){
        clientLogs.log ("handleUserError): in method");  
    },

    updateResourceSuccess = function(rsp) {
        clientLogs.log ("updatedResourceSuccess(): in method");
        alert.display("Agent "+selectedUser+" skills updated");
        $("#menu [privdata*='ulozit']").hide();
        $('#select_resource').val(selectedUser).removeClass('unsaved');
        finesse.modules.SkillManager.loadResource();
        gadgets.window.adjustHeight();
    },


    loadResourceSuccess = function(rsp) {
        clientLogs.log ("loadResourceSuccess(): in method");
        //alert.display("Successfully loaded list of agents from server");
        finesse.modules.SkillManager.createSouhrn(user.getTeamName(),rsp.content);
        finesse.modules.SkillManager.parseAdminXml(rsp.content);
        //if ($("").filter(":selected").val();)
        if ($('#select_resource').val() !== "nothing"){
            $(".skillButton").prop("disabled", false);
        }
        //$("#menu [privdata*='ulozit']").show();
        gadgets.window.adjustHeight();
        
    },
       
    loadSkillsSuccess = function(rsp) {
        clientLogs.log ("loadSkillSuccess(): in method"+rsp.content);
        //alert.display("Successfully loaded skills from server");
        var xmlDoc = $.parseXML(rsp.content),
        $xml = $(xmlDoc);
        loadedSkills = xmlDoc;
        clientLogs.log ("loadSkillSuccess(): loadedSkills: "+loadedSkills);
          
        $xml.find("skill").each(function(index) {
            var $skill = $(this);
            var skillName = $skill.find("skillName").text();
            var skillIndex = $skill.find("skillId").text();
            clientLogs.log ("loadSkillSuccess(): skillName: " + skillName + " " + skillIndex);
            var skillId = $skill.find("self").text();
            skilly[skillName] = skillId;
            clientLogs.log ("loadSkillSuccess(): in method" + skilly[skillName]);
            $("#skill_list").append("<button class=\"skillButton\" disabled onclick=finesse.modules.SkillManager.changestate('" + skillIndex + "'); privdata=" + skillIndex + ">" + skillName + "</button>");
            var curTeam = user.getTeamName();
            //clientLogs.log ("loadSkillSuccess(): curTeam: " + curTeam);
        });
        gadgets.window.adjustHeight();
    },

    makeWebServiceError = function(rsp) {
        clientLogs.log("makeWebServiceError(): in method");
        clientLogs.log("makeWebServiceError():" + rsp.content);
        alert.display("Communication with server not established, please contact system Administrator");
    },
    
    loadTeamsSuccess = function(rsp) {
        clientLogs.log ("loadTeamSuccess(): in method");
        alert.display("Successfull connection to server");
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
        $("#select_team").change(function () {
            selectedUser = "";
            finesse.modules.SkillManager.loadResource();
        });
    };
    
 /*
  * End of variables section and beginning of method section
  */
    return {
               
        prepareXmlFile : function(seluser,xml) {
            clientLogs.log ("prepareXmlFile(): zobrazuji nabidku agentu");
            selectedUser = seluser;
            var xmlDoc = $.parseXML(xml),$xml = $(xmlDoc);
          
            xmlfile = "<resource>";
            $xml.find("resource").each(function(index) {
                var $resource2 = $( this );
              
                if ($resource2.find("userID").text() === selectedUser){
                    //clientLogs.log ("prepareXmlFile(): selected user found " + selectedUser);
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
                
            });
        },    
  //################################################################################################  
    // dokoncuje XML file pro update pridanim zvolenim SKILL
        makeXmlFile: function () {
            var skillUpdate = "<skillMap>";
        
            $("#skill_list .x" + selectedUser).each(function(index){
                var skillNameTemp = $(this).text();
                var skillIndexTemp = skilly[skillNameTemp].slice(skilly[skillNameTemp].lastIndexOf('/')+1);
                
                clientLogs.log(" makeXmlFile(): testuji uzivatele na x" + skillNameTemp + " " + skillIndexTemp);
                if ($("#skill_list [privdata=" + skillIndexTemp + "]").hasClass('x'+selectedUser)) {
                    clientLogs.log(" makeXmlFile(): in method" + skillNameTemp + " x" + selectedUser); 
                    $("#skill_list [privdata=" + skillIndexTemp + "]").removeClass('x'+selectedUser);
                    $("#skill_list [privdata=" + skillIndexTemp + "]").addClass(selectedUser); 
                }
            });
            $("#skill_list .y" + selectedUser).each(function(index){
                var skillNameTemp = $(this).text();
                var skillIndexTemp = skilly[skillNameTemp].slice(skilly[skillNameTemp].lastIndexOf('/')+1);
                clientLogs.log(" makeXmlFile(): testuji uzivatele na y" + skillNameTemp);
                if ($("#skill_list [privdata=" + skillIndexTemp + "]").hasClass('y'+selectedUser)) {
                    clientLogs.log(" makeXmlFile(): in method" + skillNameTemp + " y" + selectedUser); 
                    $("#skill_list [privdata=" + skillIndexTemp + "]").removeClass('y'+selectedUser);
                    $("#skill_list [privdata=" + skillIndexTemp + "]").removeClass(selectedUser); 
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
            clientLogs.log(" makeXmlFile(): skillUpdate " + skillUpdate);
            finalXmlFile = xmlfile + skillUpdate;
        
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

            //alert.display("Configuration changed but not saved");
        },

    //###############################################################################
    //Creates a table of agents and assigned skills
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
                                var skillIndex = $skill.find("skillId").text();
                                if (countThHeader === 0){
                                    thHeader+="<th>"+skillName+"</th>";
                                }
                                clientLogs.log("createSouhrn() skillName : " + skillName); 
                                souhrnTable += "<td class='" + skillIndex + " " + userID + "'>" + skillName + "</td>";
                            
                            });   
                            countThHeader =1;
                            souhrnTable += "</tr>";
                            clientLogs.log("createSOuhrn(): " + souhrnTable);
                        }
                    }
                });
            });
            souhrnTable = "<table class=\"table table-sm table-condensed table-hoover\"><tr><th>Agent</th>"+ thHeader + "<tr>" + souhrnTable;
            souhrnTable += "</table>"; 
            $("#souhrn table").replaceWith(souhrnTable);
        },
          
          
  //################################################################################        
    /* 
     * Nasledujici funkce po nahrani agentu vytvori seznam agentu pro vyber a zobrazenym skilum 
     * prida CLASS podle nastaveni agentu
     * 
     */
        parseAdminXml: function (xml) {
            clientLogs.log ("parseAdminXml(): in method");
            var xmlDoc = $.parseXML(xml),
     
            $xml = $(xmlDoc);
            var result = '';
            var value ='';
            var count;
            var numUsers = 0;
            
            //check if selected team contains any agent.
            clientLogs.log ("parseAdminXml(): number of agents: "+$xml.find('resource').length);
            $xml.find("resource").each(function(index) {
                var $resource = $(this);
                var team = $resource.find("team").attr("name");
                var extension = $resource.find("extension").text();
                var firstName = $resource.find("firstName").text();
                var lastName = $resource.find("lastName").text();
                var userID = $resource.find("userID").text();
                clientLogs.log ("parseAdminXml(): userId: "+userID);
                $("#skill_list ." + userID).removeClass(userID); 
                
                if (team.indexOf($("#select_team").val()) > -1){

                    //if (userID === user.getId()) {
                    if (selectedUser === "") {
                        selectedUser=user.getId();
                    }
                    if (userID === selectedUser) {
                        result += "<option selected='selected' value='" + userID + "'>" + lastName + " " + firstName + "</option>";
                        numUsers = numUsers+1;
                    } else {
                        result += "<option value='" + userID + "'>" + lastName + " " + firstName + "</option>";  
                        numUsers = numUsers+1;
                    }
                    $resource.find("skillCompetency").each(function(index2) {
                        var $skillCompetency = $(this);
                        var skill = $skillCompetency.find("skillNameUriPair").attr("name");
                        var skillRef = skilly[skill].slice(skilly[skill].lastIndexOf('/')+1);
                        var skillId = skillRef.slice(skillRef.lastIndexOf('/')+1);
                        clientLogs.log ("parseAdminXml() skill: "+skill+" skillId: " + skillId + " skillRef "+skillRef);
                        //$("#skill_list").append("<p class=" + userID + ">" + skill + "</p>");
                        $("#skill_list [privdata=" + skillId + "]").addClass(userID);
                        $("#souhrn td." + userID + "." + skillId).addClass("active");
                    });
                } 
            });
               
            if (numUsers === 0) {
                //if selected team does not contain any agent, than disable skill selection
                $(".skillButton").prop("disabled", true);
                $('.ulozit').hide();
                result += "<option value='nothing'>No agents in this team</option>";
                alert.display("Selected team doas not contain any agents!");
                gadgets.window.adjustHeight();
            };
           
            
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
               
                $("#menu [privdata*='ulozit']").hide(); 
            
                $("#skill_list .x" + selectedUser).each(function(index){
                    var skillNameTemp = $(this).text();
                    var skillRef = skilly[skillNameTemp].slice(skilly[skillNameTemp].lastIndexOf('/')+1);
                    clientLogs.log ("parseAdminXml() skillnameTemp: " + skillNameTemp + " skillRef: "+skillRef);
                    $("#skill_list [privdata*=" + skillRef + "]").removeClass('x'+selectedUser);
                });
                $("#skill_list .y" + selectedUser).each(function(index){
                    var skillNameTemp = $(this).text();
                    var skillRef = skilly[skillNameTemp].slice(skilly[skillNameTemp].lastIndexOf('/')+1);
                    clientLogs.log ("parseAdminXml() skillnameTemp: " + skillNameTemp + " skillRef: "+skillRef);
                    $("#skill_list [privdata*=" + skillRef + "]").removeClass('y'+selectedUser);
                });
                finesse.modules.SkillManager.prepareXmlFile(selected,xml);
            }); 
        },
    
/*----------------------------------------------------------------------------------*/
        createNewWebServicesRequest : function (action,handlers) {
            clientLogs.log("createNewWebServicesRequest(): in method--- ");
            var contentBody = {};
            handlers = handlers || {};
            var obj = {
                method: 'GET',
                success: handlers.success,
                error: handlers.error,
                content: contentBody,
                conttype : "XML"
            };

            if (action.match('get_Skills')) {
                clientLogs.log("createNewWebServicesRequest(): get_Skills--- ");
                finesse.gadget.include.myrestRequest("/adminapi/skill",obj);
            };
            if (action.match('get_Teams')) {
                clientLogs.log("createNewWebServicesRequest(): get_Teams--- ");
                finesse.gadget.include.myrestRequest("/adminapi/team", obj);
            };
            if (action.match('get_Resource')) {
                clientLogs.log("createNewWebServicesRequest(): get_Resource--- ");
                finesse.gadget.include.myrestRequest("/adminapi/resource/", obj);
            };

            if (action.match('update_Resource')) {
                clientLogs.log("createNewWebServicesRequest(): " + action + "--- ");
                this.makeXmlFile();
                //transform czech letters into HTML entity:
                obj.content = finalXmlFile.replace(/[\u00A0-\u017F]/gim, function(i) {
                        return '&#'+i.charCodeAt(0)+';';
                });
                obj.method='PUT';
                finesse.gadget.include.myrestRequest("/adminapi/resource/" + selectedUser, obj);
               
            };
            return this;
        },


/*------------------------------------------------------------------------------------------------------- */

        loadResource : function () {
            clientLogs.log("loadResource(): in method");
            //alert.display("Loading agents from server");
            $('.ulozit').hide();
            var vyber = "<option value='Refreshing'>Refreshing.......</option>";
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
        
/*--------------------------------------------------------------------------------------------------------------
 * Inject resource = workaround for Handling Special Characters in CSS
 * based on developer guide for finesse
 * When using CSS in a gadget, the Finesse Desktop Gadget Container restricts the following special characters: @ ^ $ * :: ~
*/
        injectResource : function (url){
            clientLogs.log("injectResource"+url);
             var node = null;
            // url null? do nothing
            if (!url) {
                return;
            }
            // creates script node for .js files
            else if (url.lastIndexOf('.js') === url.length - 3){
                node = document.createElement("script");
                node.async = false;
                node.setAttribute('src', url);
            }
            // creates link node for css files
            else if (url.lastIndexOf('.css') === url.length - 4){
                clientLogs.log("shoda"+url.length);
                node = document.createElement("link");
                node.setAttribute('href', url);
                node.setAttribute('rel', 'stylesheet');
            }
                // inserts the node into dom
            if (node) {
                document.getElementsByTagName('head')[0].appendChild(node);
            }
        },        
/**
 * Performs all initialization for this gadget
 */
        init : function () {
               // declare clientLogs
            cfg = finesse.gadget.Config;
            //_util = finesse.utilities.Utilities;
            var clientLogs = finesse.cslogger.ClientLogger;
            gadgets.window.adjustHeight("350");
            	
            
            systeminfo = new finesse.restservices.SystemInfo("",{
		onLoad: _handleSystemInfoLoad,
                onChange: _handleSystemInfoChange
            });
            // Initiate the ClientServices.  ClientServices are
            // initialized with a reference to the current configuration.
            finesse.clientservices.ClientServices.init(cfg);
            
            myTimer = finesse.containerservices.ContainerServices.init();
            
            // Initiate the clientLogs. The gadget id will be logged as a part of the message
            clientLogs.init(gadgets.Hub, "SkillManager", cfg);
            clientLogs.log("init(): in method modified");
            finesse.modules.SkillManager.injectResource(finesse.gadget.skillManager.appserver.animate);
        }
    };
}(jQuery));