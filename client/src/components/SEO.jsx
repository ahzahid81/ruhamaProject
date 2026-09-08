import { useEffect } from "react";
import { SITE_NAME } from "../seo/config";

function setMeta(attr, key, content) {
  if (typeof document === "undefined" || !content) return null;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  const prev = el ? el.getAttribute("content") : null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", String(content));
  return () => {
    if (prev == null) el.remove();
    else el.setAttribute("content", prev);
  };
}

function setCanonical(href) {
  if (typeof document === "undefined" || !href) return null;
  let el = document.head.querySelector('link[rel="canonical"]');
  const prev = el ? el.getAttribute("href") : null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return () => {
    if (prev == null) el.remove();
    else el.setAttribute("href", prev);
  };
}

const JSONLD_ID = "seo-jsonld";

function setJsonLd(data) {
  if (
    typeof document === "undefined" ||
    !data ||
    (Array.isArray(data) && data.length === 0)
  ) {
    return null;
  }
  const list = Array.isArray(data) ? data : [data];
  let el = document.getElementById(JSONLD_ID);
  if (!el) {
    el = document.createElement("script");
    el.id = JSONLD_ID;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  const prev = el.textContent;
  el.textContent = JSON.stringify(list);
  return () => {
    el.textContent = prev;
    if (!prev.trim()) el.remove();
  };
}

export default function SEO({
  title,
  description,
  keywords,
  type = "website",
  url,
  image,
  imageAlt,
  noindex = false,
  jsonLd,
}) {
  const jsonLdKey = JSON.stringify(jsonLd);

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const prevTitle = document.title;
    document.title = fullTitle;

    const cleanups = [
      setMeta("name", "description", description),
      setMeta("name", "keywords", keywords),
      setMeta(
        "name",
        "robots",
        noindex ? "noindex, nofollow" : "index, follow"
      ),
      setMeta(
        "name",
        "googlebot",
        noindex ? "noindex, nofollow" : "index, follow"
      ),
      setMeta("property", "og:title", fullTitle),
      setMeta("property", "og:description", description),
      setMeta("property", "og:type", type),
      setMeta("property", "og:url", url),
      setMeta("property", "og:site_name", SITE_NAME),
      setMeta("property", "og:image", image),
      setMeta("property", "og:image:alt", imageAlt),
      setMeta(
        "name",
        "twitter:card",
        image ? "summary_large_image" : "summary"
      ),
      setMeta("name", "twitter:title", fullTitle),
      setMeta("name", "twitter:description", description),
      setMeta("name", "twitter:image", image),
      setCanonical(url),
      setJsonLd(jsonLd),
    ].filter(Boolean);

    return () => {
      document.title = prevTitle;
      cleanups.forEach((fn) => fn());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    description,
    keywords,
    type,
    url,
    image,
    imageAlt,
    noindex,
    jsonLdKey,
  ]);

  return null;
}