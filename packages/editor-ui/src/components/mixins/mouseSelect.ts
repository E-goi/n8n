import { INodeUi } from '@/Interface';

import mixins from 'vue-typed-mixins';

import { nodeIndex } from '@/components/mixins/nodeIndex';

export const mouseSelect = mixins(nodeIndex).extend({
	data () {
		return {
			selectActive: false,
			selectBox: document.createElement('span'),
		};
	},
	mounted () {
		this.createSelectBox();
	},
	methods: {
		createSelectBox () {
			this.selectBox.id = 'select-box';
			this.selectBox.style.margin = '0px auto';
			this.selectBox.style.border = '2px dotted #FF0000';
			this.selectBox.style.position = 'fixed';
			this.selectBox.style.zIndex = '100';
			this.selectBox.style.visibility = 'hidden';

			this.selectBox.addEventListener('mouseup', this.mouseUpMouseSelect);

			// document.body.appendChild(this.selectBox);
			this.$el.appendChild(this.selectBox);
		},
		showSelectBox (event: MouseEvent) {
			// @ts-ignore
			this.selectBox.x = event.pageX;
			// @ts-ignore
			this.selectBox.y = event.pageY;

			this.selectBox.style.left = event.pageX + 'px';
			this.selectBox.style.top = event.pageY + 'px';
			this.selectBox.style.visibility = 'visible';

			this.selectActive = true;
		},
		updateSelectBox (event: MouseEvent) {
			const selectionBox = this.getSelectionBox(event);
			this.selectBox.style.left = selectionBox.x + 'px';
			this.selectBox.style.top = selectionBox.y + 'px';

			this.selectBox.style.width = selectionBox.width + 'px';
			this.selectBox.style.height = selectionBox.height + 'px';
		},
		hideSelectBox () {
			this.selectBox.style.visibility = 'hidden';
			// @ts-ignore
			this.selectBox.x = 0;
			// @ts-ignore
			this.selectBox.y = 0;
			this.selectBox.style.left = '0px';
			this.selectBox.style.top = '0px';
			this.selectBox.style.width = '0px';
			this.selectBox.style.height = '0px';

			this.selectActive = false;
		},
		getSelectionBox (event: MouseEvent) {
			return {
				// @ts-ignore
				x: Math.min(event.pageX, this.selectBox.x),
				// @ts-ignore
				y: Math.min(event.pageY, this.selectBox.y),
				// @ts-ignore
				width: Math.abs(event.pageX - this.selectBox.x),
				// @ts-ignore
				height: Math.abs(event.pageY - this.selectBox.y),
			};
		},
		getNodesInSelection (event: MouseEvent): INodeUi[] {
			const returnNodes: INodeUi[] = [];
			const selectionBox = this.getSelectionBox(event);
			const offsetPosition = this.$store.getters.getNodeViewOffsetPosition;

			// Consider the offset of the workflow when it got moved
			selectionBox.x -= offsetPosition[0];
			selectionBox.y -= offsetPosition[1];

			// Go through all nodes and check if they are selected
			this.$store.getters.allNodes.forEach((node: INodeUi) => {
				// TODO: Currently always uses the top left corner for checking. Should probably use the center instead
				if (node.position[0] < selectionBox.x || node.position[0] > (selectionBox.x + selectionBox.width)) {
					return;
				}
				if (node.position[1] < selectionBox.y || node.position[1] > (selectionBox.y + selectionBox.height)) {
					return;
				}
				returnNodes.push(node);
			});

			return returnNodes;
		},
		mouseDownMouseSelect (e: MouseEvent) {
			if (e.ctrlKey === true) {
				// We only care about it when the ctrl key is not pressed at the same time.
				// So we exit when it is pressed.
				return;
			}

			if (this.$store.getters.isActionActive('dragActive')) {
				// If a node does currently get dragged we do not activate the selection
				return;
			}
			this.showSelectBox(e);

			// @ts-ignore // Leave like this. Do not add a anonymous function because then remove would not work anymore
			this.$el.addEventListener('mousemove', this.mouseMoveSelect);
		},
		mouseUpMouseSelect (e: MouseEvent) {
			if (this.selectActive === false) {
				// If it is not active return direcly.
				// Else normal node dragging will not work.
				return;
			}

			// @ts-ignore
			this.$el.removeEventListener('mousemove', this.mouseMoveSelect);

			// Deselect all nodes
			this.deselectAllNodes();

			// Select the nodes which are in the selection box
			const selectedNodes = this.getNodesInSelection(e);
			selectedNodes.forEach((node) => {
				this.nodeSelected(node);
			});

			this.hideSelectBox();
		},
		mouseMoveSelect (e: MouseEvent) {
			if (e.buttons === 0) {
				// Mouse button is not pressed anymore so stop selection mode
				// Happens normally when mouse leave the view pressed and then
				// comes back unpressed.
				this.mouseUpMouseSelect(e);
				return;
			}

			this.updateSelectBox(e);
		},

		nodeSelected (node: INodeUi) {
			this.$store.commit('addSelectedNode', node);
			const nodeElement = `node-${this.getNodeIndex(node.name)}`;
			// @ts-ignore
			this.instance.addToDragSelection(nodeElement);
		},
		deselectAllNodes () {
			// @ts-ignore
			this.instance.clearDragSelection();
			this.$store.commit('resetSelectedNodes');
			this.$store.commit('setLastSelectedNode', null);
			this.$store.commit('setActiveNode', null);
		},
	},
});
