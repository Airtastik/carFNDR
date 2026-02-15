/*
Use the following code to retrieve configured secrets from AWS Secret Manager.
const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["YOLO_KEY","TWELVE_KEY","CAR_KEY"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	YOLO_KEY
	TWELVE_KEY
	CAR_KEY
Amplify Params - DO NOT EDIT */

const axios = require('axios');

const COMMON_MAKES = [
    "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick",
    "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford",
    "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia",
    "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", "Mazda",
    "McLaren", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Opel", "Peugeot",
    "Porsche", "Ram", "Renault", "Rolls-Royce", "Subaru", "Tesla", "Toyota",
    "Volkswagen", "Volvo"
];

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    const { service, ...rest } = JSON.parse(event.body);

    if (!service) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Service not specified' }),
        };
    }

    let response;
    try {
        switch (service) {
            case 'car':
                if (rest.endpoint === 'makes') {
                    const query = rest.query || '';
                    const matching_makes = COMMON_MAKES.filter(make => make.toLowerCase().includes(query.toLowerCase()));
                    response = {
                        status: 'success',
                        makes: matching_makes.slice(0, 10)
                    };
                } else if (rest.endpoint === 'models') {
                    const { make, query, limit = 20 } = rest;
                    if (!make) {
                        return { statusCode: 400, body: JSON.stringify({ message: 'Make is required' }) };
                    }
                    const apiUrl = `https://api.api-ninjas.com/v1/cars?make=${make}&limit=50`;
                    const carResponse = await axios.get(apiUrl, {
                        headers: { 'X-Api-Key': process.env.CAR_KEY }
                    });

                    const all_models = [...new Set(carResponse.data.map(car => car.model))];
                    let matching_models = all_models;
                    if (query) {
                        matching_models = all_models.filter(model => model.toLowerCase().includes(query.toLowerCase()));
                    }
                    matching_models.sort();
                    response = {
                        status: 'success',
                        models: matching_models.slice(0, limit)
                    };
                } else {
                    return { statusCode: 400, body: JSON.stringify({ message: `Unknown endpoint for car service: ${rest.endpoint}` }) };
                }
                break;
            case 'yolo':
                // Note: File uploads require a more complex setup with S3.
                // This is a placeholder for the media search functionality.
                response = { message: 'YOLO service (media search) not implemented. File handling requires S3.', data: rest };
                break;
            case 'twelve':
                // Note: File uploads require a more complex setup with S3.
                // This is a placeholder for the media search functionality.
                response = { message: 'Twelve Labs service (media search) not implemented. File handling requires S3.', data: rest };
                break;
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: `Unknown service: ${service}` }),
                };
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify(response),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error calling service', error: error.message }),
        };
    }
};
