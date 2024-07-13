export enum CommunityEnum {
    'History', 'Food', 'Pets', 'Health', 'Fashion', 'Exercise', 'Others'
}

export type CommunityType = keyof typeof CommunityEnum;