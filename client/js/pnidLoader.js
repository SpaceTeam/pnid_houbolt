$.post( "/pnid", data={"file": "Franz.pnid"}, function( data ) {
    let svg = $(data);
    $( "body" ).append( data );
    tankSetup();
    /*setInterval(() => {
        runRandom()
    }, 1000);*/
  });
  
