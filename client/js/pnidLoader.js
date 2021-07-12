$.post( "/pnid", data={"file": "PnID_Engine.pnid"}, function( data ) {
    let svg = $(data);
    $( "body" ).append( data );
    tankSetup();
  });
  