
// IAM Role that you create for Login With Amazon
var roleArn = 'arn:aws:iam::320627489957:role/WIF';

// Login with Amazon
window.onAmazonLoginReady = function() {
    amazon.Login.setClientId('amzn1.application-oa2-client.3fe13246711f4bc5b5b2a237e5531533');
};
(function(d) {
    var a = d.createElement('script'); a.type = 'text/javascript';
    a.async = true; a.id = 'amazon-login-sdk'; 
    a.src = '//api-cdn.amazon.com/sdk/login1.js?v=3';
    d.getElementById('amazon-root').appendChild(a);
})(document);

/* if the Login With Amazon authentication is successful
   then detect the browser being used and push it into a DynamoDB table, 
   returning the updated count if the put is successful */
function amazonAuth(response) {
    if (response.error) {
        console.log(response.error);
        return;
    } 
    AWS.config.credentials = new AWS.WebIdentityCredentials({
        RoleArn: roleArn,
        ProviderId: 'www.amazon.com',
        WebIdentityToken: response.access_token
    });
    // AWS region that we're working in    
    AWS.config.region = 'us-east-1';

    amazon.Login.retrieveProfile(response.access_token, function(response) {
        // global DynamoDB object
        db = new AWS.DynamoDB();
        // global array to hold graph data
        d3Data = [];
        var detectedBrowser = identifyBrowser();
        var params = {
            TableName: 'obj-browsers',
            Key: {'browser': {'S': detectedBrowser.n}, 'version': {'S': detectedBrowser.v}},
            AttributeUpdates: {'count': {Action: 'ADD', Value: {N: '1'}}},
            ReturnValues: 'UPDATED_NEW'
        }

        // hide the login link, expose the logout link
        document.getElementById('login').innerHTML = '';
        document.getElementById('logout').innerHTML = 'Logout';
        
        // push the browser+version into the DynamoDB table and draw the chart
        db.updateItem(params, function(err, data) {
            if (err)    console.log(err, err.stack);
            else        updateBrowserCount();
        });
    });
}

// display current detected browser count
function updateBrowserCount() {
    db.scan(params = {TableName: 'obj-browsers'}, function(err, data) {
        d3Data.length = 0; // empty the array
        $.each(data.Items, function() {
            d3Data.push({'label':this.browser.S + '-' + this.version.S, 'value':this.count.N});
        });
        // draw the chart using D3
        console.log(d3Data);
        drawChart(d3Data);
    });
    // repeat...
    setTimeout(function(){updateBrowserCount()}, 3000);
}

// draw the chart with NVD3
function drawChart(d3Data) {
    nv.addGraph(function() {
        chart = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .showLabels(true)     //Display pie labels
            .labelThreshold(.05)  //Configure the minimum slice size for labels to show up
            .labelType("percent") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
            ;
        d3.select("#chart svg")
            .datum(d3Data)
			.transition().duration(100)
            .call(chart);
        nv.utils.windowResize(chart.update);
    });
}

// login with Amazon when you click the Login link
document.getElementById('login').onclick = function() {
    options = { scope : 'profile' };
    amazon.Login.authorize(options, amazonAuth);
};

// logout when you click the Logout link
document.getElementById('logout').onclick = function() {
    amazon.Login.logout();
    location.reload();
};