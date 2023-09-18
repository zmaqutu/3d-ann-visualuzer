import { MnistData } from '../ML Files/mnist_data'
import * as tf from '@tensorflow/tfjs';
import * as THREE from 'three'


// global variables
const IMAGE_WIDTH = 28;
const IMAGE_HEIGHT = 28;
const NUM_CLASSES = 10;
const NUM_DATASET_ELEMENTS = 65000;
const model = tf.sequential();
const BATCH_SIZE = 64;
const TRAIN_BATCHES = 5;
let data;

/**Potential list of actions the worker will recieve
 * initialize network
 * load examples
 * train network
 * visualize network
 */
/* eslint-disable no-restricted-globals */
self.onmessage = async function(event){
        const { action, data } = event.data;

        switch(action){
                case 'initializeNetwork':
                        initializeNetwork()
                        loadTrainingExamples()
                        break;
                case 'trainNetwork':
                        trainNetwork()
                        break;
                case 'predictInput':
                        console.log('predicting input from worker')
                        predict()
                        break;
                default:
                        console.log('no valid action provided')
        }
        
}

/** Function to define model architecture */
function initializeNetwork(){
        console.log('Initializing model...')
        // if model is already initialized, return
        if(model.layers.length > 0){
                return
        }

        // the first hidden layer with 16 neurons takes in the input of 784 pixels
        model.add(tf.layers.dense({
                inputShape: [784],
                units: 16,
                activation: 'relu',
                name: 'hiddenLayerOne'
        }))

        // hidden layer with 16 neurons
        model.add(tf.layers.dense({
                units: 16,
                activation: 'relu',
                name: 'hiddenLayerTwo'
        }))

        // output layer with 10 neurons
        model.add(tf.layers.dense({
                units: 10,
                activation: 'softmax',
                name: 'outputLayer'
        }))

        // Compile the model with Adam optimizer and categorical crossentropy loss
        model.compile({
                optimizer: tf.train.adam(),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
        })
        console.log('Model initialized')
}

async function loadTrainingExamples(){
        console.log('Loading training examples...')
        data = new MnistData()
        await data.load()
        console.log('Training examples loaded')
}

async function trainNetwork(){
        console.log('Start training...')
        for(let i = 0; i < TRAIN_BATCHES; i++){
                const batch = tf.tidy(() => {
                        // retrieve the next batch of training data of size BATCH_SIZE
                        const currentBatch = data.nextTrainBatch(BATCH_SIZE);
                        
                        // train the model on the batch
                        currentBatch.xs = currentBatch.xs.reshape([BATCH_SIZE, 784]);
                        return currentBatch;
                });
                await model.fit(
                        batch.xs,                               // input data
                        batch.labels,                           // classification data
                        {batchSize: BATCH_SIZE, epochs: 1}      // training parameters
                );
                tf.dispose(batch);
                await tf.nextFrame();
        }
        console.log('Training complete')
}

async function predict(){
        // console.log('Predicting...')
        const batch = data.nextTestBatch(1);
        const imagePixels = await getImagePixels(batch)
        postMessage({action: 'drawPredictionInput', imagePixels: imagePixels})
        tf.tidy(() => {
                const input = Array.from(batch.labels.argMax(1).dataSync());

                const output = model.predict(batch.xs.reshape([-1, 784]))

                const prediction = Array.from(output.argMax(1).dataSync());
                const image = batch.xs.slice([0, 0], [1, batch.xs.shape[1]]);

                console.log('Original Value', input)
                console.log('Predicted Value', prediction)
        })
        getActivations(batch.xs)
}

async function getImagePixels(batch){
        const imageTensor = tf.tidy(() => {
                // Reshape the image to 28x28 px
                return batch.xs
                  .slice([0, 0], [1, batch.xs.shape[1]])
                  .reshape([28, 28, 1]);
        });
        return await tf.browser.toPixels(imageTensor)
}
function getActivations(imageTensor){
        // intermediate model from hiddenLayerOne to to hiddenLayerTwo
        const layerOneBinaryActivations = getLayerBinaryActivations(imageTensor, 'hiddenLayerOne')
        
        // intermediate model from hiddenLayerTwo to outputLayer
        const layerTwoBinaryActivations = getLayerBinaryActivations(imageTensor, 'hiddenLayerTwo')

        // output layer
        const outputLayer = model.getLayer('outputLayer')
        const intermediateModelOutput = tf.model({inputs: model.input, outputs: outputLayer.output});
        const activationsOutput = intermediateModelOutput.predict(imageTensor)
        const activationsArrayOutput = Array.from(activationsOutput.dataSync())
        const outputIndex = activationsArrayOutput.indexOf(Math.max(...activationsArrayOutput))

        //get weights and biases
        // const weightsAndBiases = model.getWeights()
        // const weights = []
        // const biases = []

        // for(const tensor of weightsAndBiases){
        //         if(tensor.shape.length == 1){
        //                 biases.push(tensor.dataSync())
        //         }else{
        //                 weights.push(tensor.dataSync())
        //         }
        // }
        // console.log('weights', weights)
        // console.log('biases', biases)        
}
function getLayerBinaryActivations(imageTensor, layerName){
        const layer = model.getLayer(layerName)
        const intermediateModel = tf.model({inputs: model.input, outputs: layer.output});
        

        const activations = intermediateModel.predict(imageTensor)
        const binaryActivations = activations.greater(tf.scalar(0)).toInt().dataSync();         //relu

        return binaryActivations

}
/* eslint-enable no-restricted-globals */