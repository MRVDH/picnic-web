<template>
    <b-list-group-item>
        <div
            class="delivery-card"
            @click="modalOpen = !modalOpen"
            >
            <b-icon icon="clock" />
            {{ getDayName(slot) }} {{ getDayTimeFrame(slot) }}
        </div>

        <b-modal
            v-if="slot && deliverySlots"
            v-model="modalOpen"
            title="Kies een levertijd"
            :hide-footer="true"
            >
            <div
                v-for="deliverySlot in deliverySlots"
                :key="deliverySlot.slot_id"
                class="slot-row"
                @click="selectDeliverySlot(deliverySlot)"
                >
                <div class="date-block">
                    <span
                        class="day-title"
                        :class="{ 'unavailable': !deliverySlot.is_available }"
                        >
                        {{ getDayName(deliverySlot) }}
                    </span>
                    <br>
                    <span
                        class="day-date"
                        :class="{ 'unavailable': !deliverySlot.is_available }"
                        >
                        {{ getDayDate(deliverySlot) }}
                    </span>
                </div>

                <span class="day-time-frame">
                    <span
                        v-if="slot.slot_id !== deliverySlot.slot_id"
                        class="regular-time"
                        :class="{ 'unavailable': !deliverySlot.is_available }"
                        >
                        {{ getDayTimeFrame(deliverySlot) }}
                    </span>
                    <b-badge
                        v-else
                        variant="success"
                        pill
                        >
                        {{ getDayTimeFrame(deliverySlot) }}
                    </b-badge>
                </span>
            </div>
        </b-modal>
    </b-list-group-item>
</template>

<script>
import ApiService from '@/services/ApiService';

import { SET_CART } from '@/store/mutationTypes';

export default {
    name: 'DeliverySlot',
    data () {
        return {
            modalOpen: false
        }
    },
    computed: {
        cart: {
            get () {
                return this.$store.state.cart;
            },
            set (val) {
                this.$store.commit(SET_CART, val);
            }
        },
        slot () {
            if (!this.cart || !this.cart.delivery_slots || !this.cart.delivery_slots.length) {
                return null;
            }

            return this.cart.delivery_slots.find(x => x.slot_id === this.cart.selected_slot.slot_id);
        },
        deliverySlots () {
            if (!this.cart || !this.cart.delivery_slots || !this.cart.delivery_slots.length) {
                return null;
            }

            return this.cart.delivery_slots;
        }
    },
    methods: {
        getDayName (slot) {
            if (!slot) {
                return;
            }

            let startDate = new Date(slot.window_start);
            
            let name = startDate.toLocaleDateString("nl-NL", { weekday: 'long' });
            name = name.charAt(0).toUpperCase() + name.slice(1);
            
            return name;
        },
        getDayDate (slot) {
            if (!slot) {
                return;
            }

            let startDate = new Date(slot.window_start);
            
            let name = startDate.toLocaleDateString("nl-NL", { month: 'long' });
            name = name.charAt(0).toUpperCase() + name.slice(1);
            
            return `${startDate.getDate()} ${name.substring(0, 3)}`;
        },
        getDayTimeFrame (slot) {
            if (!slot) {
                return;
            }

            let startDate = new Date(slot.window_start);
            let endDate = new Date(slot.window_end);

            let name = `${startDate.getHours().toString().length === 1 ? '0' + startDate.getHours() : startDate.getHours()}:${startDate.getMinutes().toString().length === 1 ? '0' + startDate.getMinutes() : startDate.getMinutes()} - `;
            name += `${endDate.getHours().toString().length === 1 ? '0' + endDate.getHours() : endDate.getHours()}:${endDate.getMinutes().toString().length === 1 ? '0' + endDate.getMinutes() : endDate.getMinutes()}`;

            return name;
        },
        selectDeliverySlot (slot) {
            if (slot.slot_id === this.slot_id) {
                return
            }

            ApiService.setDeliverySlot(slot.slot_id).then((res) => {
                this.cart = res.data;
                this.modalOpen = false;
            });
        }
    }
}
</script>

<style scoped lang="scss">
.delivery-card {
    background: #f8f8f8;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 10px 15px;
    font-weight: 500;
    text-align: center;
    min-height: 46px;
    cursor: pointer;

    .b-icon {
        float: left;
        margin-top: 3px;
    }
}

.slot-row {
    padding: 10px;
    cursor: pointer;

    &:not(:last-child) {
        border-bottom: 1px solid #DDD;
    }
}

.date-block {
    display: inline-block;
}

.day-title {
    font-weight: 500;
}

.day-date {
    color: #999;
    font-size: 15px;
}

.day-time-frame {
    float: right;
    font-weight: 500;
    margin-top: 13px;

    .regular-time {
        padding-right: 11px;
    }

    .badge {
        font-size: 16px;
    }
}

.unavailable {
    color: #CCC;
    text-decoration: line-through;
}
</style>