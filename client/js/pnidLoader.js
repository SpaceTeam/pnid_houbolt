$.post( "/pnid", data={"file": "Franz.pnid"}, function( data ) {
    let svg = $(data);
    $( "#pnid" ).append( data );
    initPNID(true, "theming/", [{theme: "lightTheme", icon: "brightness-high", type: "light"},{theme: "darkTheme", icon: "moon", type: "dark"}]);
    /*setInterval(() => {
        runRandom()
    }, 1000);*/
  });
  
