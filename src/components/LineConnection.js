import React, {useRef, useState, useEffect, forwardRef} from 'react'
import * as THREE from 'three'


function LineConnection(props) {
        const points = [props.start, props.end]
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
        const lineMaterial = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth:50})
        const line = new THREE.Line(lineGeometry, lineMaterial)
        line.rotation.x = -Math.PI / 2;
        line.position.y += 155;
        // line.position.z += -5;




        return (
                <>
    		        <primitive object={line} />
                </>
        )
        }

export default LineConnection