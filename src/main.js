import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {gsap} from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {GUI} from 'lil-gui';

window.addEventListener('load',function(){
  init();
})

async function init(){
  gsap.registerPlugin(ScrollTrigger);

  const params = {
    waveColor:'#00ffff',
    backgroundColor:'#ffffff',
    fogColor:'#f0f0f0'
  }


  const gui = new GUI();
  gui.hide();

  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    alpha:true,
    antialias:true,
    canvas,
  });

  renderer.shadowMap.enabled = true;


  //renderer.setClearColor('#00ccff', 0.5);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();

  scene.fog = new THREE.Fog(0xf0f0f0, 0.1, 500);
  //scene.fog = new THREE.FogExp2(0xf0f0f0, 0.005); // 안개를 더 현실감 있게 표현해 준다.
  
  gui
    .add(scene.fog, 'near')
    .min(0)
    .max(100)
    .step(0.1);

  gui
    .add(scene.fog, 'far')
    .min(100)
    .max(500)
    .step(0.1);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    500,
  );

  camera.position.set(0,25,150);
  

  const waveGeometry = new THREE.PlaneGeometry(1500,1500,150,150);
  const waveMaterial = new THREE.MeshStandardMaterial({
    //wireframe:true,
    color:params.waveColor,
  });

  //console.log(waveGeometry.attributes.position);

  const wave = new THREE.Mesh(waveGeometry, waveMaterial);
  wave.receiveShadow = true;
  wave.rotation.x = -Math.PI / 2;
  
  const waveHeight = 2.5;
  const initialZPositions = [];

  /*
  for(let i=0;i<waveGeometry.attributes.position.array.length; i += 3){ //3개씩 한 묶음
    waveGeometry.attributes.position.array[i+2] += (Math.random() - 0.5) * waveHeight;
  }
  */

  for(let i=0; i<waveGeometry.attributes.position.count; i++){
    const z = waveGeometry.attributes.position.getZ(i) + (Math.random() - 0.5) * waveHeight;
    waveGeometry.attributes.position.setZ(i, z);
    initialZPositions.push(z);
  }

  const clock = new THREE.Clock(); // 어떤 브라우저 환경에서도 동일한 속도로 애니메이션 되도록 하기 위함

  wave.update = function(){
    const elapsedTime = clock.getElapsedTime();

    for(let i=0; i< waveGeometry.attributes.position.count; i++){ // count 정점의 갯수
      const z = initialZPositions[i] + Math.sin(elapsedTime * 3 + i**2) * waveHeight;
      waveGeometry.attributes.position.setZ(i, z);
    }

    waveGeometry.attributes.position.needsUpdate = true;
  }

  scene.add(wave);

  const gltfLoader = new GLTFLoader();
  const gltf = await gltfLoader.loadAsync('./models/ship/pirate_ship/scene.gltf');

  const ship = gltf.scene;
  //ship.castShadow = true;
  ship.traverse(object => {
    if(object.isMesh){
      object.castShadow = true;
    }
  })


  ship.update = function(){
    const elapsedTime = clock.getElapsedTime();
    ship.position.y = Math.sin(elapsedTime * 3);
  };

  ship.scale.set(40,40,40);
  ship.rotation.y = Math.PI;
  scene.add(ship);

  const pointLight = new THREE.PointLight(0xffffff,1);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.width = 1024;
  pointLight.shadow.mapSize.height = 1024;
  pointLight.shadow.radius = 10;
  pointLight.position.set(15,15,15);
  scene.add(pointLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff,0.8);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.radius = 10;
  directionalLight.position.set(-15,15,15);
  scene.add(directionalLight);

  render();

  function render(){   
    wave.update();
    ship.update();

    camera.lookAt(ship.position); // 카메라가 항상 배를 바라볼 수 있도록 하기 위함

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  function handleResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
    
  }

  window.addEventListener('resize', handleResize);

  /* gsap.to(params, {
    waveColor:'#4268ff',
    onUpdate:() => {
      waveMaterial.color = new THREE.Color(params.waveColor);
    },
    scrollTrigger:{
      trigger:'.wrapper',
      start:'top top',
      markers:true,
      scrub:true,
    }
  });

  gsap.to(params, {
    backgroundColor:'#2a2a2a',
    onUpdate:() => {
      scene.background = new THREE.Color(params.backgroundColor);
    },
    scrollTrigger:{
      trigger:'.wrapper',
      start:'top top',
      markers:true,
      scrub:true,
    }
  }); */

  const tl = gsap.timeline({
    scrollTrigger:{
      trigger:'.wrapper',
      start:'top top',
      end:'bottom bottom',
      markers:true,
      scrub:true,
    },
  });

  tl
    .to(params, {
      waveColor:'#4268ff',
      onUpdate:() => {
        waveMaterial.color = new THREE.Color(params.waveColor);
      },     
      duration:1.5, 
    })
    .to(params, {
      backgroundColor:'#2a2a2a',
      onUpdate:() => {
        scene.background = new THREE.Color(params.backgroundColor);
      },   
      duration:1.5,   
    })
    .to(params, {
      fogColor:'#2f2f2f',
      onUpdate:() => {
        scene.fog.color = new THREE.Color(params.fogColor);
      },  
      duration:1.5,    
    }, '<')
    .to(camera.position,{
      x:100,
      z:-50,
      duration:2.5,
    })
    .to(ship.position,{
      z:150,
      duration:2,
    })
    .to(camera.position,{
      x:-50,
      y:25,
      z:100,
      duration:2,
    })
    .to(camera.position,{
      x:0,
      y:50,
      z:300,
      duration:2,
    });

    gsap.to('.title',{
      opacity:0,
      scrollTrigger:{
        trigger:'.wrapper',
        scrub:true,
        pin:true,
        end:'+=1000',
      }
    })
}