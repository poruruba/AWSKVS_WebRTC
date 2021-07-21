'use strict';

let ammo_initialized = false;

const loader = new THREE.MMDLoader();

class MmdView {
  constructor(canvas, width, height, grid_enable = true, orbit_enable = true) {
    this.camera_rasio = width / height;
    this.isPaused = false;
    this.ready = false;
    this.current_index = -1;

    this.clock = new THREE.Clock();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    this.camera.position.z = 30;

    // scene

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    const ambient = new THREE.AmbientLight(0x666666);
    this.scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0x887766);
    directionalLight.position.set(-1, 1, 1).normalize();
    this.scene.add(directionalLight);

    // renderer

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
      preserveDrawingBuffer: true
    });
    this.resize(width, height);

    // option

    if (grid_enable) {
      const gridHelper = new THREE.PolarGridHelper(30, 10);
      gridHelper.position.y = -10;
      this.scene.add(gridHelper);
    }

    if (orbit_enable) {
      const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      controls.minDistance = 10;
      controls.maxDistance = 100;
    }
  }



  async loadWithAnimations(modelFile, vmdFiles, stageFile) {
    await AmmoInit();

    if (this.mesh) {
      this.ready = false;
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
    if (this.stage) {
      this.scene.remove(this.stage);
      this.stage = null;
    }

    this.helper = new THREE.MMDAnimationHelper({
      afterglow: 2.0,
    });

    this.mesh = await new Promise((resolve, reject) => {
      loader.load(modelFile, async (mesh) => {
        mesh.position.y = -10;

        this.animations = [];
        for (let i = 0; i < vmdFiles.length; i++) {
          let animation = await new Promise((resolve, reject) => {
            loader.loadAnimation(vmdFiles[i], mesh, (animation) => {
              resolve(animation);
            }, this.onProgress, reject);
          });
          this.animations[i] = {
            animation: animation
          };
        }

        var animations = this.animations.map(item => item.animation);
        this.helper.add(mesh, {
          animation: animations,
          physics: true
        });

        var mixer = this.helper.objects.get(mesh).mixer;
        mixer.stopAllAction();
        for (let i = 0; i < this.animations.length; i++)
          this.animations[i].action = mixer.clipAction(this.animations[i].animation);

        resolve(mesh);
      }, this.onProgress, reject);
    });

    this.scene.add(this.mesh);

    if (stageFile) {
      this.stage = await new Promise((resolve, reject) => {
        loader.load(stageFile, async (mesh) => {
          mesh.position.y = -10;

          resolve(mesh);
        }, this.onProgress, reject);
      });

      this.scene.add(this.stage);
    }

    if (!this.ready) {
      this.ready = true;
      this.animate(this);
    }

    this.current_index = -1;
  }

  change(index) {
    if (index < 0 || index >= this.animations.length)
      return;

    this.animations[index].action.reset();
    this.animations[index].action.setLoop(THREE.LoopOnce);
    this.animations[index].action.play();
    if (this.current_index < 0)
      this.animations[index].action.fadeIn(0.3);
    else
      this.animations[this.current_index].action.crossFadeTo(this.animations[index].action, 0.3, false);
    this.current_index = index;
  }

  async loadWithAnimation(modelFile, vmdFile, stageFile) {
    await AmmoInit();

    if (this.mesh) {
      this.ready = false;
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
    if (this.stage) {
      this.scene.remove(this.stage);
      this.stage = null;
    }

    this.helper = new THREE.MMDAnimationHelper({
      afterglow: 2.0,
    });

    this.mesh = await new Promise((resolve, reject) => {
      loader.loadWithAnimation(modelFile, vmdFile, (mmd) => {

        const mesh = mmd.mesh;
        mesh.position.y = - 10;

        const animation = mmd.animation;
        this.helper.add(mesh, {
          animation: animation,
          physics: true
        });

        resolve(mesh);
      }, this.onProgress, reject);
    });

    this.scene.add(this.mesh);

    if (stageFile) {
      this.stage = await new Promise((resolve, reject) => {
        loader.load(stageFile, async (mesh) => {
          mesh.position.y = -10;

          resolve(mesh);
        }, this.onProgress, reject);
      });

      this.scene.add(this.stage);
    }

    if (!this.ready) {
      this.ready = true;
      this.animate(this);
    }
  }

  async loadWithPose(modelFile, vpdFile, stageFile) {
    await AmmoInit();

    if (this.mesh) {
      this.ready = false;
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
    if (this.stage) {
      this.scene.remove(this.stage);
      this.stage = null;
    }

    this.helper = new THREE.MMDAnimationHelper({
      afterglow: 2.0
    });

    this.mesh = await new Promise((resolve, reject) => {
      loader.load(modelFile, async (mesh) => {
        mesh.position.y = -10;

        loader.loadVPD(vpdFile, false, (vpd) => {
          this.helper.pose(mesh, vpd);

          resolve(mesh);
        }, this.onProgress, reject);

      }, this.onProgress, reject);
    });

    this.scene.add(this.mesh);

    if (stageFile) {
      this.stage = await new Promise((resolve, reject) => {
        loader.load(stageFile, async (mesh) => {
          mesh.position.y = -10;

          resolve(mesh);
        }, this.onProgress, reject);
      });

      this.scene.add(this.stage);
    }

    if (!this.ready) {
      this.ready = true;
      this.animate();
    }
  }

  onProgress(xhr) {
    if (xhr.lengthComputable) {
      const percentComplete = xhr.loaded / xhr.total * 100;
      console.log(Math.round(percentComplete, 2) + '% downloaded');
    }
  }

  resize(width, height) {
    if (height === undefined) {
      this.renderer.setSize(width, Math.floor(width / (this.camera_rasio)));
    } else {
      this.camera_rasio = width / height;
      this.camera.aspect = this.camera_rasio;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  pause_animate() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.clock.stop();
    }
  }

  start_animate() {
    if (this.isPaused) {
      this.isPaused = false;
      this.clock.start();
    }
  }

  dispose() {
    this.ready = false;
    this.scene.remove(this.mesh);
    this.scene.remove(this.stage);
    this.renderer.dispose();
  }

  animate() {
    if (!this.ready)
      return;

    requestAnimationFrame(this.animate.bind(this));
    this.helper.update(this.clock.getDelta());
    this.renderer.render(this.scene, this.camera);
  }
}

async function AmmoInit() {
  if (ammo_initialized)
    return;
  return new Promise((resolve, reject) => {
    Ammo().
      then(function (AmmoLib) {
        Ammo = AmmoLib;
        ammo_initialized = true;
        resolve();
      })
      .catch(error => {
        reject(error);
      });
  });
}