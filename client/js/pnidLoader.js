$.post( "/pnid", data={"file": "Franz.pnid"}, function( data ) {
    let svg = $(data);
    $( "#pnid" ).append( data );
    tankSetup();
    initPNIDHitboxes(); //move that to pnid.js from the other branch (theming?)
    /*setInterval(() => {
        runRandom()
    }, 1000);*/
  });
  
