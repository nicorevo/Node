const net = require('net');
const Parser = require('teltonika-parser');
const binutils = require('binutils64');

let server = net.createServer((c) => {
 console.log("Client connected");
 c.on('end', () => {
     console.log("Client disconnected");
 });

 c.on('data', (data) => {

     let buffer = data;
     let parser = new Parser(buffer);
     if(parser.isImei){
         c.write(Buffer.alloc(1, 1));
         console.log("Sending server welcome");

     }else {
         console.log("Received data packet");
         
         let avl = parser.getAvl();

         for (i = 0; i < avl.number_of_data; i++) { 
            let record = avl.records[i];

            console.log(">>>>>>>>>>>>>>>>>>");
            console.log("Record n." + i);
            console.log("Timestamp: " + record.timestamp);
            console.log("Position: " + record.gps.longitude + ", " + record.gps.latitude);
            
            console.log("IO Elements: ");

            for (j = 0; j < record.properties_count; j++) { 
                let ioElement = record.ioElements[j];
                console.log(j + ") ID: " + ioElement.id + " Value: " + ioElement.value);
            }

            console.log("<<<<<<<<<<<<<<<<<<");
         }

         console.log("Sending data response");

         let writer = new binutils.BinaryWriter();
         writer.WriteInt32(avl.number_of_data);

         let response = writer.ByteBuffer;
         c.write(response);
     }
 });

});

server.listen(3000, () => { console.log("Server started"); });

