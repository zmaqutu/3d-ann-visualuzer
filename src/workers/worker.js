import { MnistData } from '../ML Files/mnist_data'
import * as tf from '@tensorflow/tfjs';
import * as THREE from 'three'


// global variables
const IMAGE_WIDTH = 28;
const IMAGE_HEIGHT = 28;
const NUM_CLASSES = 10;
const NUM_DATASET_ELEMENTS = 65000;
const model = tf.sequential();

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
                        break;
                // case 'loadExamples':
                //         loadExamples()
                //         break;
                // case 'trainNetwork':
                //         trainNetwork()
                //         break;
                // case 'visualizeNetwork':
                //         visualizeNetwork()
                //         break;
                default:
                        console.log('no valid action provided')
        }
        
}

/** Function to define model architecture */
function initializeNetwork(){

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

        console.log('model initialized', model)
        // postMessage({action: 'modelInitialized', data: model})
}

// async function loadExamples (){
//         const data = new MnistData()
//         await data.load()
//         const examples = data.nextTestBatch(20)
//         const numExamples = examples.xs.shape[0];

//         let tempColorBuffers = []

//         for(let i = 0; i < numExamples; i++){
//                 console.log('iteration', i)
//                 const imageTensor = tf.tidy(() => {
//                         // Reshape the image to 28x28 px
//                         return examples.xs
//                           .slice([i, 0], [1, examples.xs.shape[1]])
//                           .reshape([28, 28, 1]);
//                 });

//                 const pixels = await tf.browser.toPixels(imageTensor)

//                 const colorScheme = Float32Array.from(pixels)

//                 const currentColorAttribute = new THREE.InstancedBufferAttribute(colorScheme, 4)
//                 tempColorBuffers.push(currentColorAttribute)
                
//         }
//         return tempColorBuffers

// }
/* eslint-enable no-restricted-globals */