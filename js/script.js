
APP = {};
MAGNETIC_CONST = (4e-7) * Math.PI;

function update () {
    APP.time += 1.0/60.0;
    move_charges();
    render_charges();
    requestAnimationFrame(update);
}

function move_charges()
{
    for (var i = 0; i < APP.chargesInfo.length; i ++){
	if (APP.chargesInfo[i].life <= -1){
	    if (APP.chargesInfo[i].life == -1){
		APP.chargesInfo[i] = make_ion(APP.ionLife-2);
	    }else{
		APP.chargesInfo[i].life += 1;
		continue;
	    }
	}
	APP.chargesInfo[i].pos = APP.chargesInfo[i].pos.add(APP.chargesInfo[i].vel);
	APP.chargesInfo[i].vel = APP.chargesInfo[i].vel.add(lorentz_force_acceleration(i));
	APP.chargesInfo[i].life -= 1;
	
    }
}

function render_charges()
{
    for (var i = 0; i < APP.chargesInfo.length; i ++){
	if (APP.chargesInfo[i].life <= -1){
	    continue;
	}
	APP.chargesObjects[i].position.x = APP.chargesInfo[i].pos.e(1);
	APP.chargesObjects[i].position.y = APP.chargesInfo[i].pos.e(2);
	APP.chargesObjects[i].position.z = APP.chargesInfo[i].pos.e(3);
    }
    APP.renderer.render(APP.scene, APP.camera);
}

function randint(a, b)
{
    return Math.floor(Math.random()*(b-a) + a);
}

APP.period = 2;
APP.squareLength = 300;

function length(x, y)
{
    return Math.sqrt(x*x + y*y);
}

function magnetic_field_strength(pos)
{
    //return magnetic_field_strength_uniform();
    //return magnetic_field_strength_wire(pos);
    /*if (pos.e(1) > 370 || pos.e(1) < 300 || pos.e(2) > 270 || pos.e(2) < 200)
	return $V([0, 0, 0]);*/
    //return magnetic_field_strength_pulsular(pos);

    
    APP.lensX = -40;
    if (pos.e(1) < APP.lensX || pos.e(1) > APP.lensX + APP.lensLength ||
	length(pos.e(2), pos.e(1)) >= APP.lensRadius)
	return $V([0, 0, 0]);
    return magnetic_field_strength_magical(pos, magnetic_field_B_0(pos.e(2), 0.2, APP.lensTurns));
}

function magnetic_field_strength_uniform()
{
    return $V([0, 0, 0]);
}

function magnetic_field_strength_sinosoidal(pos)
{
    return $V([0, 0, Math.cos((pos.e(2)-300)/600)]);
}

function magnetic_field_strength_time_dependent(pos)
{
    return $V([0, 0, Math.sin(APP.time + (pos.e(2)-300)/600)]);
}

function magnetic_field_strength_pulsular(pos)
{
    //x%APP.pulseLength
    //return $V([0, 0, Math.floor]);
    var timeoffset = APP.time%APP.period;
    if (timeoffset < APP.period/2.0){
	return $V([0, 0, 0]);
    }else{
	return $V([0, 0, 0.06]);
    }
    //return $V([0, 0, Math.floor(timeoffset/(APP.period/2.0)+0.5)]);
}

function magnetic_field_B_0(z, I, N){
    return (MAGNETIC_CONST * I * APP.lensRadius*APP.lensRadius * N)/(2*Math.pow(APP.lensRadius*APP.lensRadius + z*z, 3/2));
}

function factorial(n)
{
    var res = 1;
    for (var i = 1; i <= n; i++){
	res *= i;
    }
    return res;
}

function magnetic_field_strength_magical(pos, B_0)
{
    var r = Math.sqrt(pos.e(2)*pos.e(2) + pos.e(3)*pos.e(3));
    var t = (n)=>(Math.pow((-1), n) *Math.pow(r, (2*n-1))*Math.pow(B_0, (2*n-1)))/(2*n*Math.pow(factorial(n-1), 2)*Math.pow(2, (2*n-2)));
    var theta = Math.atan2 (pos.e(2), pos.e(3));
    var B_r = 0;
    for (var i = 1; i <= 11; i ++){
	B_r += t(i);
    }
    return $V([0, B_r*Math.cos(theta), -B_r*Math.sin(theta)]);
}

function magnetic_field_strength_wire(pos)
{
    var current = 50000000.0;
    var len1 = $V([1, Math.sin(50*Math.PI/180), 0]).toUnitVector();
    var len2 = $V([1, -Math.sin(50*Math.PI/180), 0]).toUnitVector();
    
    var r1 = (len1.multiply(pos.dot(len1)));
    var B1 =  $V([0, 0, -MAGNETIC_CONST * current/(2*Math.PI*(Math.sqrt(r1.dot(r1))))]);

    var newpos = $V([0, 600, 0]).subtract(pos);
    var r2 = (len2.multiply(newpos.dot(len2)));
    var B2 =  $V([0, 0, MAGNETIC_CONST * current/(2*Math.PI*(Math.sqrt(r2.dot(r2))))]);
    //console.log(B.e(3));
    var total = B1.add(B2);
    //console.log([pos.e(1), pos.e(2)], [total.e(3)]);
    return total;
}


function lorentz_force_acceleration(charge_index)
{
    var B_ = magnetic_field_strength(APP.chargesInfo[charge_index].pos);
    var q = APP.chargeAmount;
    var V_= APP.chargesInfo[charge_index].vel;
    var F = (V_.cross(B_)).multiply(q);
    //console.log(F.
    return (F.multiply(1/APP.chargeMass));
}

function make_ion(life_)
{   
    APP.positionVariance = 20;
    var distance_from_center = APP.aperatureRadius*(1 - gaussian_2d(randint(0, 20), randint(0, 20), APP.positionVariance));
    var angle_from_center = randint(0, 360)*Math.PI/180.;
    var posy = distance_from_center * Math.sin(angle_from_center);
    var posz = distance_from_center * Math.cos(angle_from_center);
    
    var a = randint(-APP.deltaAngle, APP.deltaAngle)*Math.PI/180.;
    var y = Math.sin(a)*APP.velocities;
    var b = randint(-10, 10)*Math.PI/180.;
    var ob = {
	pos: $V([-100, posy, posz]),
	vel: $V([Math.cos(a)*APP.velocities, Math.cos(b)*y, Math.sin(b)*y]),
	life: life_,
    };
    return ob;
}

function reset_parameters()
{
    APP.chargesInfo = [];
    APP.scene = null;
    APP.scene = new THREE.Scene();

    
    APP.scene.add(APP.camera);
    APP.scene.add(APP.pointLight);
    APP.scene.add(APP.ambientLight);

    
    APP.scene.add(APP.apertureObject);

    if (APP.isLensVisible){
	APP.scene.add(APP.scene.add(APP.apertureObject2));
    }
    
    for (var i = 0; i < APP.ionCount; i ++){
	APP.chargesObjects[i].position.z = -100000;
	APP.scene.add(APP.chargesObjects[i]);
	
	APP.chargesInfo.push(make_ion(-Math.floor((i/APP.ionCount)*APP.ionLife)));
    }
}

function init()
{
    onchange_mass();
    onchange_count();
    onchange_angle();
    onchange_charge();
    onchange_velocities();
    onchange_life();
    onchange_aperature();
    onchange_lenslength();
    onchange_turns();
    
    
    APP.time = 0;

    APP.viewWidth = 800;
    APP.viewHeight = 600;

    APP.renderer = new THREE.WebGLRenderer();
    APP.camera = new THREE.PerspectiveCamera(45, APP.viewWidth/APP.viewHeight, 0.1, 10000);
APP.camera.position.set(0,0,500);
APP.camera.lookAt(new THREE.Vector3(0,0,0));
    
    APP.renderer.setSize(APP.viewWidth, APP.viewHeight);


    APP.pointLight = new THREE.PointLight(0xAAAAAA);
    APP.ambientLight = new THREE.AmbientLight(0x555555);

    
    $("#container").append(APP.renderer.domElement);

    APP.controls = new THREE.OrbitControls(APP.camera, APP.renderer.domElement);

    //APP.controls.addEventListener( 'change', function(){    APP.controls.update(); APP.renderer.render(APP.scene, APP.camera);});
    
    APP.pointLight.position.x = 10;
    APP.pointLight.position.y = 50;
    APP.pointLight.position.z = 130;

    APP.ionTexture = THREE.ImageUtils.loadTexture('res/charge.png');
    APP.ionTexture.wrapS = THREE.RepeatWrapping;
    APP.ionTexture.wrapT = THREE.RepeatWrapping;
    
    //var sphereMaterial = new THREE.MeshLambertMaterial({color: 0xCC0000});
    APP.chargeMaterial = new THREE.MeshBasicMaterial({map: APP.ionTexture, /* color: 0xFF0000*/ side: THREE.DoubleSide});

    const RADIUS = 5;
    const SEGMENTS = 4;
    const RINGS = 4;

    var torus  = new THREE.TorusGeometry(APP.aperatureRadius, APP.aperatureRadius/5.2, 6, 8);
    var material = new THREE.MeshPhongMaterial({ color: 0x2222FF }); //new THREE.MeshPhongMaterial();
    APP.apertureObject = new THREE.Mesh(torus, material);
    APP.apertureObject.rotateX(Math.PI/2);
    APP.apertureObject.rotateY(Math.PI/2);
    APP.apertureObject.position.z = 0;
    APP.apertureObject.position.x = -100;
    
    //APP.sphere = new THREE.Mesh(new THREE.SphereGeometry(RADIUS,SEGMENTS,RINGS),sphereMaterial);

    APP.geometryCount = 0;
    APP.chargesObjects = Array(5000);
    for (var i = 0; i < 5000; i ++){
	APP.chargesObjects[i] = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), APP.chargeMaterial);
    }
    
    reset_parameters();

    APP.lensX = -50;
    APP.lensLength = 150;
    APP.lensRadius = APP.aperatureRadius*1.3;
    var lensgeometry = new THREE.CylinderGeometry( APP.lensRadius, APP.lensRadius, APP.lensLength, 8, 1, true );
    
    APP.apertureObject2 = new THREE.Mesh(lensgeometry, material);
    APP.apertureObject2.position.x = APP.lensX + APP.lensLength/2.0;
    APP.apertureObject2.rotateZ(Math.PI/2.0);

    
    /*
    var torustest  = new THREE.TorusGeometry(10, 5, 6, 8);

    APP.apertureObject2 = new THREE.Mesh(torustest, material);
    APP.apertureObject2.position.z = 0;
    APP.apertureObject2.position.x = 0;
    
    APP.apertureObject3 = new THREE.Mesh(torustest, material);
    APP.apertureObject3.position.z = 0;
    APP.apertureObject3.position.x = 100;


    APP.scene.add(APP.apertureObject3);    
*/    
   

    handle_lensvisible();
    
    APP.doneInit = true;
    requestAnimationFrame(update);
}

function relabel(id_name, new_value)
{
    $("#"+id_name).text(new_value);
}

function onchange_mass(t)
{
    t = t ? t.value : $("#mass").val();
    APP.chargeMass = parseFloat(t);
    relabel("massl", t);
}

function onchange_life(t)
{
    t = t ? t.value : $("#massflow").val();
    // there's an inverse relation between life of particle ins and flowrate
    APP.ionLife = Math.floor(10000*1000/parseFloat(t) / (APP.ionCount));
    relabel("massflowl", t);
    if (APP.doneInit == true)
	reset_parameters();
}

function onchange_count(t)
{
    t = t ? t.value : $("#ion_count").val();
    APP.ionCount = parseFloat(t);
    relabel("ion_countl", t);
    if (APP.doneInit == true)
	reset_parameters();
}

function onchange_angle(t)
{
    t = t ? t.value : $("#angle").val();
    console.log($("#anglel"));
    APP.deltaAngle = parseFloat(t);
    relabel("anglel", t);
}

function onchange_charge(t)
{
    t = t ? t.value : $("#charge").val();
    APP.chargeAmount = parseFloat(t);
    relabel("chargel", t);
}

function onchange_velocities(t)
{
    t = t ? t.value : $("#velocities").val();
    APP.velocities = parseFloat(t);
    relabel("velocitiesl", t);
}

function onchange_aperature(t)
{
    var oldradius = APP.aperatureRadius;
    t = t ? t.value : $("#aperature").val();
    APP.aperatureRadius = parseFloat(t);
    relabel("aperaturel", t);
    if (APP.doneInit == true){
	var scaleFactor = APP.aperatureRadius/oldradius;
	APP.apertureObject.scale.y *= scaleFactor;
	APP.apertureObject.scale.x *= scaleFactor;
	APP.apertureObject.scale.z *= scaleFactor;
    }
}

function onchange_lenslength(t)
{
    t = t ? t.value : $("#lenslength").val();
    APP.lensLength = parseFloat(t);
    relabel("lenslengthl", t);
}

function onchange_turns(t)
{
    t = t ? t.value : $("#turns").val();
    APP.lensTurns = parseFloat(t)*50;
    relabel("turnsl", t);
}


function handle_lensvisible()
{
    APP.isLensVisible = $('#islensvisible').is(":checked");
    reset_parameters();
}

function gaussian(x, expected, variance)
{
    return (1/(variance*Math.sqrt(2*Math.PI)))*Math.exp(-0.5*Math.pow((x-expected)/variance, 2));
}

// https://en.wikipedia.org/wiki/Gaussian_function#Two-dimensional_Gaussian_function
function gaussian_2d(x, y, variance)
{
    var d = (Math.pow(x, 4) + Math.pow(y, 4))/(2*variance);
    return Math.exp(-d);
}

// Refer to paper
function double_gaussian(r, a, variance)
{
    gaussian(r, -a/4, variance)+gaussian(r, a/4, variance)
} 

function hodge()
{
    // weighed distribution
    WEIGHED_DOUBLE_GAUSSIAN_TABLE = [];
    for (var r = 0; r < 10000; r ++){
	var v =  double_gaussian(r/10000.0, 1.0);
	console.log(v);
	for (var i = 0; i < v*50; i ++){
	    WEIGHED_DOUBLE_GAUSSIAN_TABLE.push(r/10000.0);
	}
    }
}
