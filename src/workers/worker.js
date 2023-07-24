import { MnistData } from '../ML Files/mnist_data'
import * as tf from '@tensorflow/tfjs';
import * as THREE from 'three'

/* eslint-disable no-restricted-globals */
self.onmessage = async function(event){
        const { action, data } = event.data;
                
        postMessage({action: action, data: data})
        console.log(action, data)
        

        let colorAttributesArray = []
        if(action == 'loadExamples'){
                colorAttributesArray = await loadExamples()
                postMessage({action: 'loadExamples', data: colorAttributesArray})
        }
}

async function loadExamples (){
        const data = new MnistData()
        await data.load()
        const examples = data.nextTestBatch(20)
        const numExamples = examples.xs.shape[0];

        let tempColorBuffers = []

        for(let i = 0; i < numExamples; i++){
                console.log('iteration', i)
                const imageTensor = tf.tidy(() => {
                        // Reshape the image to 28x28 px
                        return examples.xs
                          .slice([i, 0], [1, examples.xs.shape[1]])
                          .reshape([28, 28, 1]);
                });

                const pixels = await tf.browser.toPixels(imageTensor)

                const colorScheme = Float32Array.from(pixels)

                const currentColorAttribute = new THREE.InstancedBufferAttribute(colorScheme, 4)
                tempColorBuffers.push(currentColorAttribute)
                
        }
        // setColorAttributesArray(tempColorBuffers)
        return tempColorBuffers

}
/* eslint-enable no-restricted-globals */