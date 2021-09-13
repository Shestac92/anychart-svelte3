
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Chart.svelte generated by Svelte v3.42.4 */
    const file$2 = "src/Chart.svelte";

    function create_fragment$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", container);
    			attr_dev(div, "class", "svelte-1u17il4");
    			add_location(div, file$2, 47, 0, 1126);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const container = 'chart-container';

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chart', slots, []);
    	let { data } = $$props;
    	let { type } = $$props;

    	// variable for a chart instance
    	let chart;

    	// helper functinon for building a chart with passed type and data
    	const createChart = (type, data) => {
    		// dispose chart if exists, it is required to change chart type
    		if (chart) {
    			chart.dispose();
    		}

    		// create chart with the specified constructor
    		chart = anychart[type](data);

    		// chart title
    		chart.title('Product distribution');

    		// configure axes' settings and series name for column/bar chart
    		if (type !== 'pie') {
    			chart.xAxis().title('Product');
    			chart.yAxis().title('Amount');
    			chart.getSeries(0).name('Products');
    		}

    		// enable chart legend and animation
    		chart.legend(true);

    		chart.animation(true);

    		// render the chart to the specified DIV tag
    		chart.container(container).draw();
    	};

    	// recreate chart on props update
    	afterUpdate(() => {
    		createChart(type, data);
    	});

    	const writable_props = ['data', 'type'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chart> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		data,
    		type,
    		container,
    		chart,
    		createChart
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    		if ('chart' in $$props) chart = $$props.chart;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, type];
    }

    class Chart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { data: 0, type: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !('data' in props)) {
    			console.warn("<Chart> was created without expected prop 'data'");
    		}

    		if (/*type*/ ctx[1] === undefined && !('type' in props)) {
    			console.warn("<Chart> was created without expected prop 'type'");
    		}
    	}

    	get data() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Controls.svelte generated by Svelte v3.42.4 */
    const file$1 = "src/Controls.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let label0;
    	let t1;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t7;
    	let label1;
    	let t9;
    	let select1;
    	let option3;
    	let t10_value = "Data Set 1" + "";
    	let t10;
    	let t11;
    	let option3_value_value;
    	let option4;
    	let t12_value = "Data Set 2" + "";
    	let t12;
    	let option4_value_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label0 = element("label");
    			label0.textContent = "Chart type";
    			t1 = space();
    			select0 = element("select");
    			option0 = element("option");

    			option0.textContent = `${"Column"} 
    `;

    			option1 = element("option");

    			option1.textContent = `${"Bar"} 
    `;

    			option2 = element("option");
    			option2.textContent = `${"Pie"}`;
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Select data set";
    			t9 = space();
    			select1 = element("select");
    			option3 = element("option");
    			t10 = text(t10_value);
    			t11 = space();
    			option4 = element("option");
    			t12 = text(t12_value);
    			attr_dev(label0, "for", "chartType");
    			attr_dev(label0, "class", "svelte-1yylix3");
    			add_location(label0, file$1, 10, 2, 176);
    			option0.__value = "column";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file$1, 12, 4, 312);
    			option1.__value = "bar";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 15, 4, 382);
    			option2.__value = "pie";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 18, 4, 437);
    			attr_dev(select0, "id", "chartType");
    			attr_dev(select0, "class", "svelte-1yylix3");
    			if (/*chartOpts*/ ctx[0].selectedChartType === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[2].call(select0));
    			add_location(select0, file$1, 11, 2, 222);
    			attr_dev(label1, "for", "dataSet");
    			attr_dev(label1, "class", "svelte-1yylix3");
    			add_location(label1, file$1, 23, 2, 503);
    			option3.__value = option3_value_value = /*dataSets*/ ctx[1][0];
    			option3.value = option3.__value;
    			add_location(option3, file$1, 25, 4, 638);
    			option4.__value = option4_value_value = /*dataSets*/ ctx[1][1];
    			option4.value = option4.__value;
    			add_location(option4, file$1, 28, 4, 706);
    			attr_dev(select1, "id", "dataSet");
    			attr_dev(select1, "class", "svelte-1yylix3");
    			if (/*chartOpts*/ ctx[0].selectedDataSet === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[3].call(select1));
    			add_location(select1, file$1, 24, 2, 552);
    			attr_dev(div, "class", "svelte-1yylix3");
    			add_location(div, file$1, 9, 0, 168);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label0);
    			append_dev(div, t1);
    			append_dev(div, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*chartOpts*/ ctx[0].selectedChartType);
    			append_dev(div, t7);
    			append_dev(div, label1);
    			append_dev(div, t9);
    			append_dev(div, select1);
    			append_dev(select1, option3);
    			append_dev(option3, t10);
    			append_dev(option3, t11);
    			append_dev(select1, option4);
    			append_dev(option4, t12);
    			select_option(select1, /*chartOpts*/ ctx[0].selectedDataSet);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[2]),
    					listen_dev(select0, "change", change_handler, false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[3]),
    					listen_dev(select1, "change", change_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*chartOpts*/ 1) {
    				select_option(select0, /*chartOpts*/ ctx[0].selectedChartType);
    			}

    			if (dirty & /*dataSets*/ 2 && option3_value_value !== (option3_value_value = /*dataSets*/ ctx[1][0])) {
    				prop_dev(option3, "__value", option3_value_value);
    				option3.value = option3.__value;
    			}

    			if (dirty & /*dataSets*/ 2 && option4_value_value !== (option4_value_value = /*dataSets*/ ctx[1][1])) {
    				prop_dev(option4, "__value", option4_value_value);
    				option4.value = option4.__value;
    			}

    			if (dirty & /*chartOpts*/ 1) {
    				select_option(select1, /*chartOpts*/ ctx[0].selectedDataSet);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const change_handler = () => {
    	
    };

    const change_handler_1 = () => {
    	
    };

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Controls', slots, []);
    	let { dataSets } = $$props;

    	let { chartOpts = {
    		selectedChartType: 'column',
    		selectedDataSet: []
    	} } = $$props;

    	const writable_props = ['dataSets', 'chartOpts'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	function select0_change_handler() {
    		chartOpts.selectedChartType = select_value(this);
    		$$invalidate(0, chartOpts);
    	}

    	function select1_change_handler() {
    		chartOpts.selectedDataSet = select_value(this);
    		$$invalidate(0, chartOpts);
    	}

    	$$self.$$set = $$props => {
    		if ('dataSets' in $$props) $$invalidate(1, dataSets = $$props.dataSets);
    		if ('chartOpts' in $$props) $$invalidate(0, chartOpts = $$props.chartOpts);
    	};

    	$$self.$capture_state = () => ({ Chart, dataSets, chartOpts });

    	$$self.$inject_state = $$props => {
    		if ('dataSets' in $$props) $$invalidate(1, dataSets = $$props.dataSets);
    		if ('chartOpts' in $$props) $$invalidate(0, chartOpts = $$props.chartOpts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [chartOpts, dataSets, select0_change_handler, select1_change_handler];
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { dataSets: 1, chartOpts: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controls",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dataSets*/ ctx[1] === undefined && !('dataSets' in props)) {
    			console.warn("<Controls> was created without expected prop 'dataSets'");
    		}
    	}

    	get dataSets() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataSets(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get chartOpts() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chartOpts(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var cosmeticksData = [["Eyeshadows",249980],["Eyeliner",213210],["Eyebrow pencil",170670],["Nail polish",143760],["Lipstick",128000],["Lip gloss",110430],["Mascara",102610],["Foundation",94190],["Rouge",80540],["Powder",53540]];

    var pancakeFillingsData = [["Chocolate",5],["Rhubarb compote",2],["Crêpe Suzette",2],["American blueberry",2],["Buttermilk",1]];

    /* src/App.svelte generated by Svelte v3.42.4 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p0;
    	let t2;
    	let a0;
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let a1;
    	let t8;
    	let t9;
    	let p2;
    	let t10;
    	let a2;
    	let t12;
    	let t13;
    	let controls;
    	let updating_chartOpts;
    	let t14;
    	let chart;
    	let current;

    	function controls_chartOpts_binding(value) {
    		/*controls_chartOpts_binding*/ ctx[2](value);
    	}

    	let controls_props = { dataSets: /*dataSets*/ ctx[1] };

    	if (/*chartOpts*/ ctx[0] !== void 0) {
    		controls_props.chartOpts = /*chartOpts*/ ctx[0];
    	}

    	controls = new Controls({ props: controls_props, $$inline: true });
    	binding_callbacks.push(() => bind(controls, 'chartOpts', controls_chartOpts_binding));

    	chart = new Chart({
    			props: {
    				type: /*chartOpts*/ ctx[0].selectedChartType,
    				data: /*chartOpts*/ ctx[0].selectedDataSet
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Svelte - AnyChart integration demo";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("To learn more about building charts visit ");
    			a0 = element("a");
    			a0.textContent = "the AnyChart Documentation";
    			t4 = text(".");
    			t5 = space();
    			p1 = element("p");
    			t6 = text("You can find all products by AnyChart on ");
    			a1 = element("a");
    			a1.textContent = "the official official website";
    			t8 = text(".");
    			t9 = space();
    			p2 = element("p");
    			t10 = text("Visit the ");
    			a2 = element("a");
    			a2.textContent = "Svelte tutorial";
    			t12 = text(" to learn how to build Svelte apps.");
    			t13 = space();
    			create_component(controls.$$.fragment);
    			t14 = space();
    			create_component(chart.$$.fragment);
    			attr_dev(h1, "class", "svelte-gbn13f");
    			add_location(h1, file, 16, 1, 442);
    			attr_dev(a0, "href", "https://docs.anychart.com/Quick_Start/Quick_Start");
    			add_location(a0, file, 18, 46, 533);
    			attr_dev(p0, "class", "svelte-gbn13f");
    			add_location(p0, file, 18, 1, 488);
    			attr_dev(a1, "href", "https://anychart.com/");
    			add_location(a1, file, 19, 45, 674);
    			attr_dev(p1, "class", "svelte-gbn13f");
    			add_location(p1, file, 19, 1, 630);
    			attr_dev(a2, "href", "https://svelte.dev/tutorial");
    			add_location(a2, file, 20, 14, 759);
    			attr_dev(p2, "class", "svelte-gbn13f");
    			add_location(p2, file, 20, 1, 746);
    			attr_dev(main, "class", "svelte-gbn13f");
    			add_location(main, file, 15, 0, 434);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(p0, t2);
    			append_dev(p0, a0);
    			append_dev(p0, t4);
    			append_dev(main, t5);
    			append_dev(main, p1);
    			append_dev(p1, t6);
    			append_dev(p1, a1);
    			append_dev(p1, t8);
    			append_dev(main, t9);
    			append_dev(main, p2);
    			append_dev(p2, t10);
    			append_dev(p2, a2);
    			append_dev(p2, t12);
    			append_dev(main, t13);
    			mount_component(controls, main, null);
    			append_dev(main, t14);
    			mount_component(chart, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const controls_changes = {};

    			if (!updating_chartOpts && dirty & /*chartOpts*/ 1) {
    				updating_chartOpts = true;
    				controls_changes.chartOpts = /*chartOpts*/ ctx[0];
    				add_flush_callback(() => updating_chartOpts = false);
    			}

    			controls.$set(controls_changes);
    			const chart_changes = {};
    			if (dirty & /*chartOpts*/ 1) chart_changes.type = /*chartOpts*/ ctx[0].selectedChartType;
    			if (dirty & /*chartOpts*/ 1) chart_changes.data = /*chartOpts*/ ctx[0].selectedDataSet;
    			chart.$set(chart_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(controls.$$.fragment, local);
    			transition_in(chart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(controls.$$.fragment, local);
    			transition_out(chart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(controls);
    			destroy_component(chart);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const dataSets = [cosmeticksData, pancakeFillingsData];

    	// declare chart component props with default values
    	let chartOpts = {
    		selectedChartType: 'column',
    		selectedDataSet: dataSets[0]
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function controls_chartOpts_binding(value) {
    		chartOpts = value;
    		$$invalidate(0, chartOpts);
    	}

    	$$self.$capture_state = () => ({
    		Chart,
    		Controls,
    		cosmeticksData,
    		pancakeFillingsData,
    		dataSets,
    		chartOpts
    	});

    	$$self.$inject_state = $$props => {
    		if ('chartOpts' in $$props) $$invalidate(0, chartOpts = $$props.chartOpts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [chartOpts, dataSets, controls_chartOpts_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
