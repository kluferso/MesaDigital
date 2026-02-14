package com.mesadigital.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material.MaterialTheme
import androidx.compose.material.darkColors
import androidx.compose.material.lightColors
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Cores do tema claro
private val LightColorPalette = lightColors(
    primary = Blue500,
    primaryVariant = Blue700,
    secondary = Pink500,
    background = Gray50,
    surface = Color.White,
    error = Red500,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Gray900,
    onSurface = Gray900,
    onError = Color.White
)

// Cores do tema escuro
private val DarkColorPalette = darkColors(
    primary = Blue200,
    primaryVariant = Blue700,
    secondary = Pink200,
    background = Gray900,
    surface = Gray800,
    error = Red300,
    onPrimary = Gray900,
    onSecondary = Gray900,
    onBackground = Color.White,
    onSurface = Color.White,
    onError = Gray900
)

@Composable
fun MesaDigitalTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) {
        DarkColorPalette
    } else {
        LightColorPalette
    }

    MaterialTheme(
        colors = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
