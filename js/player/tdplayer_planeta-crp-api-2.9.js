//Change platformid buttons - Triton Digital QA usage only.
var platformid = 'prod';
var techPriority = ['Html5'];
var sbm = true;
var aSyncCuePointFallback = true;
var hls = true;
var streamAutoStart = true;

var player; /* TD player instance */
var station = 'CRP_MOD'; /* Default audio station */
var csegid= 1001;  //1001 oficial de moda
var csegid2= 666;  //666 se escucha luego del play
var flag_escucho= false;

var radio='MODA';
var stationId = 64013; //64013

var adPlaying; /* boolean - Ad break currently playing */
var currentTrackCuePoint; /* Current Track */
var livePlaying; /* boolean - Live stream currently playing */
var podcastPlaying;
var companions; /* VAST companion banner object */
var song; /* Song object that wraps NPE data */

var currentStation = ''; /* String - Current station played */
var flowAds = false;
var titulo = "";

function initPlayerSDK()
{
    console.log( 'TD Player SDK is ready' );
    //Player SDK is ready to be used, this is where you can instantiate a new TDSdk instance.
    //Player configuration: list of modules
    var tdPlayerConfig = {
        coreModules: [{
                id: 'MediaPlayer',
                playerId: 'td_container',
                platformId: platformid + '01', //prod01 by default.
                techPriority: techPriority,
                sbm:{ active:sbm, aSyncCuePointFallback:aSyncCuePointFallback },
                //hls:hls,
                geoTargeting:{ desktop:{ isActive:true }, iOS:{ isActive:true }, android:{ isActive:true } },
                idSync:{station:station},
                plugins: [ {id:"vastAd"}, {id:"bloom"}, {id:"mediaAd"} ]
            },
            { id: 'NowPlayingApi'},
            { id: 'TargetSpot' },
            { id: 'SyncBanners', keepElementsVisible:false, elements:[{id:'td_synced_bigbox', width:300, height:250}, {id:'td_synced_leaderboard', width:728, height:90}], vastCompanionPriority:['static','iframe','html'] }
        ],
        playerReady: onPlayerReady,
        configurationError: onConfigurationError,
        moduleError: onModuleError,
        adBlockerDetected: onAdBlockerDetected,
    };     
    //Player instance
    player = new TDSdk( tdPlayerConfig );
    
}
/* Callback function para notificar que el SDK está listo para usarse */
function onPlayerReady(){
    player.addEventListener( 'track-cue-point', onTrackCuePoint );
    player.addEventListener( 'nowplaying-api-error', onNowPlayingApiError);
    player.addEventListener( 'stream-status', streamStatus);
    //player.play( {station:station} );//Función para llamar al player
    ServiceARO(radio,autoPlay);//Función llamada a ARO
}
function playStreamOnly(){
    //player.play( {station:station, trackingParameters:{ csegid:csegid }});
    playStream();
}
//STAR STREAMING Origen : Webservices
//CRP Si hay hay video pre-roll y este a acabado consultamos hasta que el enveto video_ended=1
function ReadyStreaming() {
    console.log("Estado: video/audio ended play streaming");
    playStream();  //Play Streaming con el Segid para segmentar
}

function playStream(){
    //Si escuchamos por segunda vez
    if(flag_escucho==true){
        csegid = csegid2;
        console.log("Se cambió el Csegid por escucharse por 2da vez. var csegid:" + csegid);
    }
    // player.play( {station:station} );
    player.play( {station:station, trackingParameters:{ csegid:csegid }});
}

function playTAPAd(){
  console.log("tap desktop");
    detachAdListeners();
    attachAdListeners();
    player.stop();
    player.playAd('tap', { host: 'http://195.154.182.222:25318/stream?type=.mp3', type: 'audio', format: 'mp3', stationId: stationId, csegid: csegid });
}

function playTAPAdMobile(){
    console.log("tap mobile");
    detachAdListeners();
    attachAdListeners();
    player.stop();
    //player.playAd( 'tap', { host:'cmod.live.streamtheworld.com', type:'preroll', format:'vast', stationId:77583 } );
    player.playAd('tap', { host: 'http://195.154.182.222:25318/stream?type=.mp3', type: 'audio', format: 'mp3', stationId: stationId, csegid: csegid });
    //player.playAd( 'vastAd', { url:'http://cmod284.live.streamtheworld.com/ondemand/ars?type=preroll&stid='+stationId+'&fmt=vast&csegid='+csegid } );
}
function attachAdListeners()
{
    player.addEventListener( 'ad-playback-start', onAdPlaybackStart );
    player.addEventListener( 'ad-playback-error', onAdPlaybackError );
    player.addEventListener( 'ad-playback-complete', onAdPlaybackComplete );
    player.addEventListener( 'ad-playback-destroy', onAdPlaybackDestroy);
}
function detachAdListeners()
{
    player.removeEventListener( 'ad-playback-start', onAdPlaybackStart );
    player.removeEventListener( 'ad-playback-error', onAdPlaybackError );
    player.removeEventListener( 'ad-playback-complete', onAdPlaybackComplete );
    player.removeEventListener( 'ad-playback-destroy', onAdPlaybackDestroy );
}
function onAdPlaybackStart(e){
    adPlaying = true;
    setStatus( 'Advertising... Type=' + e.data.type );
}

function onAdPlaybackComplete(e){
    adPlaying = false;
    console.log(e);
    console.log("llego on play back complete");
    $( "#td_synced_bigbox" ).empty();
    $( "#td_synced_leaderboard" ).empty();
    if(streamAutoStart){
        console.log("entro"+streamAutoStart);
        if(flag_mobile){
            console.log(flag_mobile);
            //Habilitando botones para Mobile
            $( "#pauseButton" ).attr( "onclick", "ShowBtnPlayMobile(); stopStream();" );
            //Cambiando a PLay Stream despues de completar el TAp
            $( "#playMobile" ).attr( "onclick", "ShowBtnPauseMobile(); playStream();" );
        }
        else{
             //Habilitando botones para Mobile
            $( "#pauseButton" ).attr( "onclick", "  ShowBtnPlay(); stopStream();" );
            //Cambiando a PLay Stream despues de completar el TAp
            $( "#playButton" ).attr( "onclick", "ShowBtnPause(); playStream();" );
        }
        player.play( { station:station } );
    }

    setStatus( 'Ad Playback Complete' );
}
function onAdPlaybackError(e){
    if(streamAutoStart){
        if(flag_mobile){
            //Habilitando botones para Mobile
            $( "#pauseButton" ).attr( "onclick", "ShowBtnPlayMobile(); stopStream();");
            //Cambiando a PLay Stream despues de completar el TAp
            $( "#playMobile" ).attr( "onclick", "ShowBtnPauseMobile(); playStream();");
         } else {            
            $( "#pauseButton" ).attr( "onclick", "ShowBtnPlay(); stopStream();");
            //Cambiando a PLay Stream despues de completar el TAp
            $( "#playButton" ).attr( "onclick", "ShowBtnPause(); playStream();");  
        }      
    }
    setStatus( 'Ad Playback Error' );
    player.play( {station: station, trackingParameters:{csegid:csegid}});
}
function onAdPlaybackDestroy(e){
    adPlaying = false;
    console.log(e);
    $( "#td_synced_bigbox" ).empty();
    $( "#td_synced_leaderboard" ).empty();
    setStatus('Ad Playback Destroy');
}

/* Callback function para notificar que la configuración del reproductor tiene un error. */
function onConfigurationError( e ) {
    console.log(object);
    console.log(object.data.errors);       
    //Error code : object.data.errors[0].code
    //Error message : object.data.errors[0].message    
}
/* Callback function para notificar que un módulo no se ha cargado correctamente*/
function onModuleError( object )
{
    console.log(object);
    console.log(object.data.errors);       
    //Error code : object.data.errors[0].code
    //Error message : object.data.errors[0].message
}
/* Callback function para notificar que entra un nuevo Track CuePoint. */
function onTrackCuePoint( e )
{
    console.log( 'onTrackCuePoint' );
    console.log( e.data.cuePoint );
    //Display now playing information in the "onair" div element.
    //document.getElementById('onair').innerHTML = 'Artist: ' + e.data.cuePoint.artistName + '<BR>Title: ' + e.data.cuePoint.cueTitle;
    document.getElementById('titletext').innerHTML = e.data.cuePoint.cueTitle;
    document.getElementById('artisttext').innerHTML = e.data.cuePoint.artistName;
    titulo = e.data.cuePoint.cueTitle + "+" + e.data.cuePoint.artistName;
    Itunes();
}
/* Callback function para notificar que se detectó un bloqueador de anuncios*/
function onAdBlockerDetected(){
    console.log( 'AdBlockerDetected' );
}
function onNowPlayingApiError(e){
    console.log( 'tdplayer::onNowPlayingApiError' + e );
}
function streamStatus(e){
    setStatus( e.data.status);
}
function setStatus( status ){
    document.getElementById('status').innerHTML = 'Status: ' + status;
}
/**FUNCIONES DE BOTONES**/
function stopStream(){ player.stop(); }
function pauseStream(){ player.stop(); }//puase stream por strop stream
function mute(){ player.mute(); }
function unMute(){ player.unMute(); }
function setVolumeControl(val) {
    var value = val;
    player.setVolume(value);
}

//BOTONES
function ShowBtnPause() {
  $('#playButton').hide();
  $('#pauseButton').show();
}
function ShowBtnPlay() {
    player.stop();
    $('#playButton').show();
    $('#pauseButton').hide();
}
function ShowBtnPlayMobile() {
    $('#playMobile').show();
    $('#pauseButton').hide();
}
function ShowBtnPauseMobile() {
    $('#playMobile').hide();
    $('#pauseButton').show();
}
function ShowControlVolumen() {
    $('#control').show();
}
function HideControlVolumen() {
    $('#control').hide();
}
function ShowBtnMute() {
    $('#muteButton').hide();
    $('#unMuteButton').show();
}
function HideBtnUnmute() {
     $('#muteButton').show();
    $('#unMuteButton').hide();
}