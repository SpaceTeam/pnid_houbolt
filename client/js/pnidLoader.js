$.post( "/pnid", data={"file": "PnID_Coldflow.pnid"}, function( data ) {
    let svg = $(data);
    $( "body" ).append( data );
    tankSetup();
    setInterval(() => {
        runRandom()
    }, 1000);
  });
  