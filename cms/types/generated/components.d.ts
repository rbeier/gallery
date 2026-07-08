import type { Schema, Struct } from '@strapi/strapi';

export interface PhotoTag extends Struct.ComponentSchema {
  collectionName: 'components_photo_tags';
  info: {
    displayName: 'Tag';
    icon: 'hashtag';
  };
  attributes: {
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'photo.tag': PhotoTag;
    }
  }
}
