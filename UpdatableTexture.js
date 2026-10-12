import {
	Box2,
	LinearFilter,
	LinearMipmapLinearFilter,
	Texture,
	Vector2
} from 'three';

const source = new Texture();
const region = new Box2();
const position = new Vector2();

class UpdatableTexture extends Texture {

	constructor( format, type, mapping, wrapS, wrapT, magFilter = LinearFilter, minFilter = LinearMipmapLinearFilter, anisotropy, colorSpace ) {

		super( { data: null, width: 1, height: 1 }, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace );

		this.isUpdatableTexture = true;

		// allocated from its size alone, like a data texture with nothing to upload yet
		this.isDataTexture = true;
		this.source.dataReady = false;

		this.generateMipmaps = true;
		this.flipY = true;
		this.unpackAlignment = 1;

		this.renderer = null;

	}

	get width() {

		return this.image.width;

	}

	get height() {

		return this.image.height;

	}

	setRenderer( renderer ) {

		this.renderer = renderer;

	}

	setSize( width, height ) {

		if ( ! this.renderer ) throw new Error( 'UpdatableTexture: call setRenderer() before setSize()' );

		const max = this.renderer.capabilities.maxTextureSize;

		if ( ! ( width >= 1 && width <= max && height >= 1 && height <= max ) ) {

			throw new RangeError( 'UpdatableTexture: width and height must be between 1 and ' + max + ', got ' + width + 'x' + height );

		}

		width = Math.floor( width );
		height = Math.floor( height );

		if ( width === this.width && height === this.height && this.version > 0 ) return;

		// GPU storage can't be resized, so it's released and allocated again
		this.dispose();
		this.image = { data: null, width, height };
		this.source.dataReady = false;
		this.needsUpdate = true;
		this.renderer.initTexture( this );

	}

	update( src, x, y, width, height ) {

		if ( ! this.renderer ) throw new Error( 'UpdatableTexture: call setRenderer() before update()' );

		const isData = ArrayBuffer.isView( src );

		if ( ! isData ) {

			width = src.videoWidth || src.displayWidth || src.width;
			height = src.videoHeight || src.displayHeight || src.height;

		}

		if ( ! ( width >= 1 && height >= 1 ) ) {

			throw new Error( 'UpdatableTexture: the source has no size, a typed array needs update( data, x, y, width, height )' );

		}

		if ( x < 0 || y < 0 || x + width > this.width || y + height > this.height ) {

			throw new RangeError( 'UpdatableTexture: ' + width + 'x' + height + ' at ' + x + ',' + y + ' does not fit in ' + this.width + 'x' + this.height );

		}

		source.isDataTexture = isData;
		source.image = isData ? { data: src, width, height } : src;

		region.min.set( 0, 0 );
		region.max.set( width, height );
		position.set( x, this.flipY ? this.height - y - height : y );

		this.renderer.copyTextureToTexture( source, this, region, position );

		source.image = null;

	}

}

export { UpdatableTexture };
