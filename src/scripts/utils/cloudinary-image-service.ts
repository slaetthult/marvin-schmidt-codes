import type { ExternalImageService, ImageTransform, AstroConfig } from "astro";

type ServiceConfig = {
    cloudName: string;
    deliveryType?: "fetch";
    baseTransforms?: string[];
    maxWidth?: number;
};

function mapFitToCloudinary(fit?: ImageTransform["fit"]) {
    switch (fit) {
        case "cover":
        case "fill":
            return "c_fill";
        case "contain":
            return "c_fit";
        case "inside":
            return "c_limit";
        case "outside":
            return "c_lfill";
        default:
            return undefined;
    }
}

const service: ExternalImageService = {
    validateOptions(options, imageConfig) {
        const cfg = imageConfig.service.config as ServiceConfig;
        if (cfg?.maxWidth && options.width && options.width > cfg.maxWidth) {
            console.warn(`Image width ${options.width} > max ${cfg.maxWidth}. Verwende maxWidth.`);
            options.width = cfg.maxWidth;
        }
        return options;
    },

    getURL(options, imageConfig) {
        const cfg = imageConfig.service.config as ServiceConfig;
        if (!cfg?.cloudName) throw new Error("image.service.config.cloudName fehlt");

        let src = typeof options.src === "string" ? options.src : options.src.src;
        if(!src?.startsWith('http')){
            src = `${process.env.PUBLIC_PAGE_URL}${src}`;
        }
        const base = `https://res.cloudinary.com/${cfg.cloudName}/image/${cfg.deliveryType ?? "fetch"}`;

        const parts = [
            ...(cfg.baseTransforms ?? ["f_auto", "q_auto"]),
            options.width && `w_${options.width}`,
            mapFitToCloudinary(options.fit),
            options.format && `f_${options.format}`,
            typeof options.quality === "number" && `q_${options.quality}`,
        ].filter(Boolean);

        const transform = parts.join(",");
        return `${base}/${transform}/${src}`;
    },

    getHTMLAttributes(options) {
        const { src, format, quality, ...rest } = options;
        return { loading: options.loading ?? "lazy", decoding: options.decoding ?? "async", ...rest };
    },

    async getSrcSet(options) {
        const widths = options.widths ?? [320, 640, 768, 1024, 1280, 1600];
        return widths.map((w) => ({
            transform: { ...options, width: w },
            descriptor: `${w}w`,
        }));
    },
};

export default service;