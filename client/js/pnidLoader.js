$.post( "/pnid", data={"file": "Franz.pnid"}, function( data ) {
    let svg = $(data);
    $( "#pnid" ).append( data );
    tankSetup();
    /*setInterval(() => {
        runRandom()
    }, 1000);*/
  });
  
