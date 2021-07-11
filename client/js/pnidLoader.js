$.post( "/pnid", data={"file": "PnID_Franz.pnid"}, function( data ) {
    let svg = $(data);
    $( "body" ).append( data );
  });