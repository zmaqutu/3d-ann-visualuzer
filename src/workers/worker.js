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
const TRAIN_BATCHES = 150;
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
                
        // postMessage({action: action, data: data})

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

        // input layer with 784 neurons
        model.add(tf.layers.dense({
                inputShape: [784],
                units: 16,
                activation: 'relu'
        }))

        // hidden layer with 16 neurons
        model.add(tf.layers.dense({
                units: 16,
                activation: 'relu'
        }))

        // output layer with 10 neurons
        model.add(tf.layers.dense({
                units: 10,
                activation: 'softmax'
        }))

        // Compile the model with Adam optimizer and categorical crossentropy loss
        model.compile({
                optimizer: tf.train.adam(),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
        })
        console.log('Model initialized')

        // console.log('model initialized', model.layers[0].getWeights()[0].print())
        // model.weights.forEach(w => {
        //         console.log(w.name, w.shape);
        // });
        // postMessage({action: 'modelInitialized', data: model})
        // model.layers[1].getWeights()[0].print()
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
        // model.layers[1].getWeights()[0].print()

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
        // console.log('Prediction complete')
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
/* eslint-enable no-restricted-globals */