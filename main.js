canvas = document.getElementById("myCanvas")
var context = canvas.getContext('2d');
canvas.width = window.innerWidth - 50;
canvas.height = canvas.width // window.innerHeight - 150;
canvas_width = canvas.width
canvas_height = canvas.height

// centers at origin 
context.setTransform(1, 0, 0, 1, canvas_width / 2, canvas_height / 2);
context.scale(1, -1) // flips vertically

var background_color = [255, 255, 255] // White 

const scene = {
    viewport_width: 1,
    viewport_height: 1,
    dist_to_viewport: 1,
    spheres: [{
        center: [0, -1, 3],
        radius: 1,
        color: [255, 0, 0],
        specular: 500
    },
    {
        center: [2, 0, 4],
        radius: 1,
        color: [0, 0, 255],
        specular: 500
    }, {
        center: [-2, 0, 4],
        radius: 1,
        color: [0, 255, 0],
        specular: 10
    }, {
        center: [0, -5001, 0],
        radius: 5000,
        color: [255, 255, 0],
        specular: 1000
    }],
    lights: [{
        type: "ambient",
        intensity: 0.2
    }, {
        type: "point",
        intensity: 0.6,
        position: [2, 1, 0]
    }, {
        type: "directional",
        intensity: 0.2,
        direction: [1, 4, 4]
    }]
}

function dotProduct(a, b) {
    const result = a.reduce((acc, cur, index) => {
        acc += (cur * b[index]);
        return acc;
    }, 0);
    return result;
}

function CanvasToViewport(x, y) {
    return [x * scene.viewport_width / canvas_width, y * scene.viewport_height / canvas_height, scene.dist_to_viewport]
}

function ComputeLighting(intersection, sphere_normal, V, specular) {
    //console.log(intersection, sphere_normal)
    i = 0.0
    for (j = 0; j < scene.lights.length; j++) {
        var light = scene.lights[j]
        if (light.type == "ambient") {
            i += light.intensity
        } else {
            if (light.type == "point") {
                //console.log(light.position, intersection)
                L = subVector(light.position, intersection)
            } else {
                L = light.direction
            }

            //console.log(sphere_normal, L)
            n_dot_l = dotProduct(sphere_normal, L)
            if (n_dot_l > 0) {
                i += light.intensity * n_dot_l / (vecLength(sphere_normal) * vecLength(L))
            }

            /*if (specular != -1) {
                somedot = 2*dotProduct(sphere_normal, L)
                console.log("somedot: ", somedot)
                multipliedsome =  mulVector(sphere_normal, somedot)
                console.log("multipliedsome: ", somedot)
                R = subVector(L, multipliedsome) 
                //console.log("R: ", R)
                r_dot_v = dotProduct(R, V)
                if (r_dot_v > 0) {
                    i += light.intensity * Math.pow(r_dot_v / (vecLength(R) * vecLength(V)), specular)
                }
            }*/
        }
    }
    //console.log(intersection, sphere_normal, V, specular)
    //console.log("i : ", i)
    return i
}

function draw() {
    origin = [0, 0, 0]
    for (xpos = -canvas_width / 2; xpos < canvas_width / 2; xpos++) {
        for (ypos = -canvas_height / 2; ypos < canvas_height / 2; ypos++) {
            var direction = CanvasToViewport(xpos, ypos)
            var [r, g, b] = TraceRay(origin, direction, 1, Infinity)
            //console.log(r, g, b)
            context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
            context.fillRect(xpos, ypos, 1, 1);
        }
    }

    //var startTime = performance.now()
    //var endTime = performance.now()
    // console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)
}

draw()

function subVector(a, b) {
    return a.map((e, i) => e - b[i]);
}

function addVector(a, b) {
    return a.map((e, i) => e + b[i]);
}

function mulVector(a, b) {
    for (i = 0; i < a.length; i++) {
        a[i] = a[i] * b
    }
    return a
}

function devVector(a, b) {
    for (i = 0; i < a.length; i++) {
        a[i] = a[i] / b
    }
    return a
}

function vecLength(a) {
    return Math.sqrt(dotProduct(a, a))
}

function closestIntersection(origin, direction, t_min, t_max) {
    closest_t = Infinity
    closest_sphere = null
    for (i = 0; i < scene.spheres.length; i++) {
        sphere = scene.spheres[i]
        var [t1, t2] = IntersectRaySphere(origin, direction, sphere)
        if (t1 > t_min && t1 < t_max && t1 < closest_t) {
            closest_t = t1
            closest_sphere = sphere
        }
        if (t2 > t_min && t2 < t_max && t2 < closest_t) {
            closest_t = t2
            closest_sphere = sphere
        }
    }
    return [closest_sphere, closest_t]
}

function TraceRay(origin, direction, t_min, t_max) {
    var [closest_sphere, closest_t] = closestIntersection(origin, direction, t_min, t_max)
    if (closest_sphere == null) {
        return background_color
    }
    //console.log(closest_sphere.color)
    //console.log("start: origin closest direction", origin, closest_t, direction)
    //console.log("multiply: ", mulVector(direction, closest_t))
    multiplied = mulVector(direction, closest_t)
    intersection = addVector(origin, multiplied)
    //console.log("intersection: ", intersection)
    sphere_normal = subVector(intersection, closest_sphere.center)
    sphere_normal = devVector(sphere_normal, vecLength(sphere_normal))
    //console.log("sphere normal: ", sphere_normal)
    change_sign = mulVector(direction, -1)
    return_lighting = ComputeLighting(intersection, sphere_normal, change_sign, closest_sphere.specular)
    //console.log("return lighting: ", return_lighting)
    //console.log(closest_sphere.color)
    save_close_color = closest_sphere.color.slice(0)
    multiplied = mulVector(save_close_color, return_lighting)
    //console.log("mulvector: ", multiplied)
    return multiplied /*closest_sphere.color*/ /*mulVector(closest_sphere.color, return_lighting)*/
}

function IntersectRaySphere(origin, direction, sphere) {
    radius = sphere.radius
    dist_center = subVector(origin, sphere.center)

    a = dotProduct(direction, direction)
    b = 2 * dotProduct(dist_center, direction)
    c = dotProduct(dist_center, dist_center) - radius * radius

    discriminant = b * b - 4 * a * c

    if (discriminant < 0) {
        return [Infinity, Infinity]
    }

    t1 = (-b + Math.sqrt(discriminant)) / (2 * a)
    t2 = (-b - Math.sqrt(discriminant)) / (2 * a)
    return [t1, t2]
} 
