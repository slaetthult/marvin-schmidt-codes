import type { ExternalImageService, ImageTransform, AstroConfig } from "astro";

type ServiceConfig = {
    cloudName: string;
    deliveryType?: "fetch";
    baseTransforms?: string[];
    maxWidth?: number;
    /** Retina multipliers to include in srcset. Default = [2] (2x). */
    retinaDPRs?: number[];
};

// Optionally extend ImageTransform so we can handle dpr if we ever switch to "x" descriptors.
// type CloudTransform = ImageTransform & { dpr?: number };

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
        if (!src?.startsWith("http")) {
            src = `${process.env.PUBLIC_PAGE_URL}${src}`;
        }

        const base = `https://res.cloudinary.com/${cfg.cloudName}/image/${cfg.deliveryType ?? "fetch"}`;

        const parts = [
            ...(cfg.baseTransforms ?? ["f_auto", "q_auto"]),
            options.width && `w_${options.width}`,
            mapFitToCloudinary(options.fit),
            options.format && `f_${options.format}`,
            typeof options.quality === "number" && `q_${options.quality}`,
            // If you ever decide to do DPR-based (x-descriptor) srcsets, uncomment the line below
            // and add `dpr` to the transform objects coming from getSrcSet.
            // (options as any).dpr && `dpr_${(options as any).dpr}`,
        ].filter(Boolean);

        const transform = parts.join(",");
        return `${base}/${transform}/${src}`;
    },

    getHTMLAttributes(options) {
        const { src, format, quality, ...rest } = options;
        return {
            loading: options.loading ?? "lazy",
            decoding: options.decoding ?? "async",
            ...rest,
        };
    },

    async getSrcSet(options) {
        const widthsFromOptions = options.widths ?? (options.width ? [options.width] : undefined);
        // Reasonable default widths if none provided:
        const baseWidths = widthsFromOptions ?? [320, 640, 768, 1024, 1280, 1600];

        // Include retina widths by multiplying base widths with the configured DPRs.
        const cfg = (options as any)._imageConfig?.service?.config as ServiceConfig | undefined;
        const retinaDPRs = [];

        const allWidths = new Set<number>();
        for (const w of baseWidths) {
            allWidths.add(w);
            for (const dpr of retinaDPRs) {
                allWidths.add(Math.round(w * dpr));
            }
        }

        // Respect maxWidth if configured.
        const maxW = cfg?.maxWidth ?? Infinity;
        const finalWidths = [...allWidths].filter((w) => w <= maxW).sort((a, b) => a - b);

        // Map to width-descriptor srcset items.
        return finalWidths.map((w) => ({
            transform: { ...options, width: w },
            descriptor: `${w}w`,
        }));
    },
};

export default service;