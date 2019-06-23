import dateformat from 'dateformat';

import { showMessage } from '@/components/mixins/showMessage';
import { MessageType } from '@/Interface';

import mixins from 'vue-typed-mixins';

export const genericHelpers = mixins(showMessage).extend({
	data () {
		return {
			loadingService: null as any | null, // tslint:disable-line:no-any
		};
	},
	computed: {
		isReadOnly (): boolean {
			if (['NodeViewExisting', 'NodeViewNew'].includes(this.$route.name as string)) {
				return false;
			}
			return true;
		},
	},
	methods: {
		convertToDisplayDate (epochTime: number) {
			return dateformat(epochTime, 'yyyy-mm-dd HH:MM:ss');
		},

		editAllowedCheck (): boolean {
			if (this.isReadOnly) {
				this.$showMessage({
					title: 'Workflow can not be changed!',
					message: `The workflow can not be edited as a past execution gets displayed. To make changed either open the original workflow of which the execution gets displayed or save it under a new name first.`,
					type: 'error',
					duration: 0,
				});

				return false;
			}
			return true;
		},

		startLoading () {
			if (this.loadingService !== null) {
				return;
			}

			this.loadingService = this.$loading(
				{
					lock: true,
					text: 'Loading',
					spinner: 'el-icon-loading',
					background: 'rgba(255, 255, 255, 0.8)',
				}
			);
		},
		stopLoading () {
			if (this.loadingService !== null) {
				this.loadingService.close();
				this.loadingService = null;
			}
		},

		async confirmMessage (message: string, headline: string, type = 'warning' as MessageType, confirmButtonText = 'OK', cancelButtonText = 'Cancel'): Promise<boolean> {
			try {
				await this.$confirm(message, headline, {
					confirmButtonText,
					cancelButtonText,
					type,
					dangerouslyUseHTMLString: true,
				});
				return true;
			} catch (e) {
				return false;
			}
		},

	},
});
